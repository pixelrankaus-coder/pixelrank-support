import Imap from "imap";
import { simpleParser, ParsedMail, Source } from "mailparser";
import { prisma } from "./db";
import { runTicketCreatedAutomations, runTicketUpdatedAutomations } from "./automation-engine";
import { emailLogger } from "./email-activity-logger";

interface FetchResult {
  success: boolean;
  newTickets: number;
  newMessages: number;
  errors: string[];
}

interface EmailChannelConfig {
  id: string;
  email: string;
  imapHost: string | null;
  imapPort: number | null;
  imapUser: string | null;
  imapPassword: string | null;
  imapSecure: boolean;
}

/**
 * Extract reply text from email body (remove quoted previous messages)
 */
function extractReplyText(text: string): string {
  // Common patterns for quoted text
  const patterns = [
    /^>.*$/gm, // Lines starting with >
    /^On .* wrote:$/gm, // "On ... wrote:" lines
    /^-{3,}.*Original Message.*-{3,}$/gim, // Original message separators
    /^_{3,}$/gm, // Underline separators
    /^From:.*$/gm, // From: headers in quoted text
    /^Sent:.*$/gm, // Sent: headers
    /^To:.*$/gm, // To: headers in quoted text
    /^Subject:.*$/gm, // Subject: headers in quoted text
  ];

  let cleanText = text;

  // Find the first quoted section and cut off everything after
  const quoteMarkers = [
    /\n>/, // Standard quote marker
    /\nOn .* wrote:/i,
    /\n-{3,}.*Original Message/i,
    /\n_{3,}\nFrom:/i,
  ];

  for (const marker of quoteMarkers) {
    const match = cleanText.match(marker);
    if (match && match.index !== undefined) {
      cleanText = cleanText.substring(0, match.index);
    }
  }

  return cleanText.trim();
}

/**
 * Parse ticket number from email subject (e.g., "Re: [Ticket #123] Subject here")
 */
function parseTicketNumberFromSubject(subject: string): number | null {
  const match = subject.match(/\[(?:Ticket\s*)?#?(\d+)\]/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Connect to IMAP and fetch unread emails
 */
async function fetchEmailsFromChannel(channel: EmailChannelConfig): Promise<{
  emails: ParsedMail[];
  errors: string[];
}> {
  const startTime = Date.now();
  const channelName = channel.email;

  return new Promise((resolve) => {
    const emails: ParsedMail[] = [];
    const errors: string[] = [];

    if (!channel.imapHost || !channel.imapPort || !channel.imapUser || !channel.imapPassword) {
      const error = `⚠️ IMAP not configured for ${channel.email} - cannot fetch incoming emails`;
      errors.push(error);
      emailLogger.warn(error, {
        channelId: channel.id,
        channelName,
        details: {
          imapHost: channel.imapHost || "not set",
          imapPort: channel.imapPort || "not set",
          imapUser: channel.imapUser ? "configured" : "not set",
        },
      });
      resolve({ emails, errors });
      return;
    }

    emailLogger.connection(`📥 Connecting to mail server ${channel.imapHost}:${channel.imapPort}...`, {
      channelId: channel.id,
      channelName,
      details: { host: channel.imapHost, port: channel.imapPort, secure: channel.imapSecure },
    });

    const imap = new Imap({
      user: channel.imapUser,
      password: channel.imapPassword,
      host: channel.imapHost,
      port: channel.imapPort,
      tls: channel.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once("ready", () => {
      const connectDuration = Date.now() - startTime;
      emailLogger.connection(`✅ Connected to mail server successfully (${connectDuration}ms)`, {
        channelId: channel.id,
        channelName,
        duration: connectDuration,
      });

      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          const error = `❌ Failed to open inbox: ${err.message}`;
          errors.push(error);
          emailLogger.error(error, {
            channelId: channel.id,
            channelName,
            details: { error: err.message },
          });
          imap.end();
          resolve({ emails, errors });
          return;
        }

        emailLogger.fetch(`📂 Opened INBOX - ${box?.messages?.total || 0} total emails, ${box?.messages?.unseen || 0} unread`, {
          channelId: channel.id,
          channelName,
          details: { totalMessages: box?.messages?.total, unseenMessages: box?.messages?.unseen },
        });

        // Search for unseen emails
        imap.search(["UNSEEN"], (searchErr, results) => {
          if (searchErr) {
            const error = `❌ Failed to search for new emails: ${searchErr.message}`;
            errors.push(error);
            emailLogger.error(error, {
              channelId: channel.id,
              channelName,
              details: { error: searchErr.message },
            });
            imap.end();
            resolve({ emails, errors });
            return;
          }

          if (!results || results.length === 0) {
            emailLogger.fetch("📭 No new unread emails to process", {
              channelId: channel.id,
              channelName,
              duration: Date.now() - startTime,
            });
            console.log(`No new emails for ${channel.email}`);
            imap.end();
            resolve({ emails, errors });
            return;
          }

          emailLogger.fetch(`📬 Found ${results.length} new email(s) to process`, {
            channelId: channel.id,
            channelName,
            details: { count: results.length },
          });
          console.log(`Found ${results.length} new emails for ${channel.email}`);

          const fetch = imap.fetch(results, { bodies: "", markSeen: true });
          let pending = results.length;

          fetch.on("message", (msg) => {
            msg.on("body", (stream) => {
              simpleParser(stream as unknown as Source, (parseErr, parsed) => {
                if (parseErr) {
                  const error = `❌ Failed to parse email: ${parseErr.message}`;
                  errors.push(error);
                  emailLogger.error(error, {
                    channelId: channel.id,
                    channelName,
                  });
                } else {
                  emails.push(parsed);
                  const subject = parsed.subject?.substring(0, 50) || "No subject";
                  const from = parsed.from?.value?.[0]?.address || "unknown sender";
                  emailLogger.fetch(`📧 Processing email: "${subject}" from ${from}`, {
                    channelId: channel.id,
                    channelName,
                    level: "DEBUG",
                    details: {
                      from: parsed.from?.value?.[0]?.address,
                      subject: parsed.subject,
                      date: parsed.date?.toISOString(),
                    },
                  });
                }

                pending--;
                if (pending === 0) {
                  const totalDuration = Date.now() - startTime;
                  emailLogger.fetch(`✅ Finished processing ${emails.length} email(s) in ${(totalDuration / 1000).toFixed(1)}s`, {
                    channelId: channel.id,
                    channelName,
                    duration: totalDuration,
                    details: { emailCount: emails.length, errorCount: errors.length },
                  });
                  imap.end();
                  resolve({ emails, errors });
                }
              });
            });
          });

          fetch.once("error", (fetchErr) => {
            const error = `❌ Error downloading emails: ${fetchErr.message}`;
            errors.push(error);
            emailLogger.error(error, {
              channelId: channel.id,
              channelName,
              details: { error: fetchErr.message },
            });
            imap.end();
            resolve({ emails, errors });
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      const duration = Date.now() - startTime;
      // Provide human-readable error messages
      let humanError = err.message;
      const lowerError = err.message.toLowerCase();

      if (lowerError.includes("timeout") || lowerError.includes("etimedout")) {
        humanError = `Connection timed out after ${(duration / 1000).toFixed(1)}s. Possible causes: 1) Wrong port (use 993 for IMAP SSL), 2) Server blocking connection, 3) Firewall issues, 4) Server not responding`;
      } else if (lowerError.includes("econnrefused")) {
        humanError = "Connection refused. The server is not accepting connections on this port. Check the host and port settings.";
      } else if (lowerError.includes("auth") || lowerError.includes("login")) {
        humanError = "Authentication failed. Check username and password. Use an app-specific password if 2FA is enabled.";
      } else if (lowerError.includes("enotfound")) {
        humanError = "Server not found. The hostname might be incorrect or DNS is not resolving.";
      }

      const error = `❌ Connection failed: ${humanError}`;
      errors.push(error);
      emailLogger.error(error, {
        channelId: channel.id,
        channelName,
        duration,
        details: {
          originalError: err.message,
          host: channel.imapHost,
          port: channel.imapPort,
        },
      });
      resolve({ emails, errors });
    });

    imap.once("end", () => {
      console.log(`IMAP connection ended for ${channel.email}`);
    });

    imap.connect();
  });
}

/**
 * Process a single email and create/update ticket
 */
async function processEmail(email: ParsedMail, channelId: string): Promise<{
  newTicket: boolean;
  newMessage: boolean;
  error?: string;
}> {
  try {
    const fromAddress = email.from?.value?.[0];
    if (!fromAddress?.address) {
      return { newTicket: false, newMessage: false, error: "No sender address" };
    }

    const senderEmail = fromAddress.address.toLowerCase();
    const senderName = fromAddress.name || senderEmail.split("@")[0];
    const subject = email.subject || "No Subject";
    const body = email.text || email.html || "";
    const cleanBody = extractReplyText(body);

    // Check if this is a reply to an existing ticket
    const ticketNumber = parseTicketNumberFromSubject(subject);

    if (ticketNumber) {
      // This is a reply - find the existing ticket
      const ticket = await prisma.ticket.findFirst({
        where: { ticketNumber },
        include: { contact: true },
      });

      if (ticket) {
        // Verify sender matches the contact
        if (ticket.contact?.email?.toLowerCase() === senderEmail) {
          // Add message to existing ticket
          await prisma.ticketMessage.create({
            data: {
              ticketId: ticket.id,
              body: cleanBody || body,
              authorType: "CONTACT",
              authorId: ticket.contactId,
              authorName: senderName,
              contactAuthorId: ticket.contactId,
            },
          });

          // Update ticket status if it was closed/resolved
          const previousStatus = ticket.status;
          if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: { status: "OPEN", updatedAt: new Date() },
            });

            // Run ticket updated automations for status change
            runTicketUpdatedAutomations(ticket.id, { status: previousStatus }).catch((err) =>
              console.error("Failed to run ticket updated automations:", err)
            );
          } else {
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: { updatedAt: new Date() },
            });
          }

          console.log(`Added reply to ticket #${ticketNumber} from ${senderEmail}`);
          return { newTicket: false, newMessage: true };
        }
      }
    }

    // This is a new ticket or couldn't match to existing
    // Find or create contact
    let contact = await prisma.contact.findUnique({
      where: { email: senderEmail },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          email: senderEmail,
          name: senderName,
        },
      });
    }

    // Get next ticket number
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true },
    });
    const newTicketNumber = (lastTicket?.ticketNumber || 0) + 1;

    // Create new ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: newTicketNumber,
        subject: subject.replace(/^(Re:|Fwd?:)\s*/gi, "").trim() || "No Subject",
        description: cleanBody || body,
        status: "OPEN",
        priority: "MEDIUM",
        source: "EMAIL",
        contactId: contact.id,
      },
    });

    // Create initial message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        body: cleanBody || body,
        authorType: "CONTACT",
        authorId: contact.id,
        authorName: senderName,
        contactAuthorId: contact.id,
      },
    });

    console.log(`Created new ticket #${newTicketNumber} from ${senderEmail}: ${subject}`);

    // Run ticket created automations
    runTicketCreatedAutomations(ticket.id).catch((err) =>
      console.error("Failed to run ticket created automations:", err)
    );

    return { newTicket: true, newMessage: false };
  } catch (error) {
    console.error("Failed to process email:", error);
    return {
      newTicket: false,
      newMessage: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch emails from all active email channels
 */
export async function fetchAllEmails(): Promise<FetchResult> {
  const startTime = Date.now();
  const result: FetchResult = {
    success: true,
    newTickets: 0,
    newMessages: 0,
    errors: [],
  };

  try {
    await emailLogger.info("🔄 Starting email fetch for all channels...");

    // Get all active email channels with IMAP configured
    const channels = await prisma.emailChannel.findMany({
      where: {
        isActive: true,
        imapHost: { not: null },
        imapPort: { not: null },
      },
    });

    if (channels.length === 0) {
      const error = "⚠️ No email channels configured with IMAP settings";
      result.errors.push(error);
      await emailLogger.warn(error);
      return result;
    }

    await emailLogger.info(`📋 Found ${channels.length} active email channel(s) to check`, {
      details: { channelCount: channels.length, channels: channels.map(c => c.email) },
    });

    for (const channel of channels) {
      console.log(`Fetching emails for ${channel.email}...`);

      const { emails, errors } = await fetchEmailsFromChannel(channel);
      result.errors.push(...errors);

      for (const email of emails) {
        const processed = await processEmail(email, channel.id);

        if (processed.error) {
          result.errors.push(processed.error);
        }

        if (processed.newTicket) {
          result.newTickets++;
        }

        if (processed.newMessage) {
          result.newMessages++;
        }
      }
    }

    const duration = Date.now() - startTime;
    const summary = result.newTickets > 0 || result.newMessages > 0
      ? `✅ Fetch complete! Created ${result.newTickets} new ticket(s), added ${result.newMessages} reply(s)`
      : `✅ Fetch complete - no new emails to process`;

    await emailLogger.info(summary, {
      duration,
      details: {
        newTickets: result.newTickets,
        newMessages: result.newMessages,
        errorCount: result.errors.length,
        duration: `${(duration / 1000).toFixed(1)}s`,
      },
    });

    return result;
  } catch (error) {
    console.error("Email fetch failed:", error);
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(errorMessage);
    await emailLogger.error(`❌ Email fetch failed: ${errorMessage}`, {
      duration: Date.now() - startTime,
      details: { error: errorMessage },
    });
    return result;
  }
}

/**
 * Fetch emails from a specific channel by ID
 */
export async function fetchEmailsFromChannelById(channelId: string): Promise<FetchResult> {
  const startTime = Date.now();
  const result: FetchResult = {
    success: true,
    newTickets: 0,
    newMessages: 0,
    errors: [],
  };

  try {
    const channel = await prisma.emailChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      result.success = false;
      const error = "❌ Email channel not found";
      result.errors.push(error);
      await emailLogger.error(error, { channelId });
      return result;
    }

    const channelName = channel.name || channel.email;

    if (!channel.imapHost || !channel.imapPort) {
      result.success = false;
      const error = "⚠️ IMAP not configured for this channel";
      result.errors.push(error);
      await emailLogger.warn(error, {
        channelId: channel.id,
        channelName,
        details: { imapHost: channel.imapHost || "not set", imapPort: channel.imapPort || "not set" },
      });
      return result;
    }

    await emailLogger.info(`🔄 Starting email fetch for ${channelName}...`, {
      channelId: channel.id,
      channelName,
    });

    console.log(`Fetching emails for ${channel.email}...`);

    const { emails, errors } = await fetchEmailsFromChannel(channel);
    result.errors.push(...errors);

    for (const email of emails) {
      const processed = await processEmail(email, channel.id);

      if (processed.error) {
        result.errors.push(processed.error);
      }

      if (processed.newTicket) {
        result.newTickets++;
      }

      if (processed.newMessage) {
        result.newMessages++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = result.newTickets > 0 || result.newMessages > 0
      ? `✅ Fetch complete for ${channelName}! Created ${result.newTickets} new ticket(s), added ${result.newMessages} reply(s)`
      : `✅ Fetch complete for ${channelName} - no new emails`;

    await emailLogger.info(summary, {
      channelId: channel.id,
      channelName,
      duration,
      details: {
        newTickets: result.newTickets,
        newMessages: result.newMessages,
        errorCount: result.errors.length,
        duration: `${(duration / 1000).toFixed(1)}s`,
      },
    });

    return result;
  } catch (error) {
    console.error("Email fetch failed:", error);
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(errorMessage);
    await emailLogger.error(`❌ Email fetch failed: ${errorMessage}`, {
      channelId,
      duration: Date.now() - startTime,
      details: { error: errorMessage },
    });
    return result;
  }
}
