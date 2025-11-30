import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import Imap from "imap";
import { emailLogger } from "@/lib/email-activity-logger";
import * as dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

// Helper to format duration in human readable format
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// Helper to mask password for logging (show length and first/last char)
function maskPassword(password: string | null): string {
  if (!password) return "❌ NOT SET";
  if (password.length < 3) return `⚠️ TOO SHORT (${password.length} chars)`;
  if (password.trim() !== password) return `⚠️ HAS LEADING/TRAILING SPACES (${password.length} chars)`;
  return `✓ Set (${password.length} chars: ${password[0]}${"*".repeat(Math.min(password.length - 2, 10))}${password[password.length - 1]})`;
}

// Helper to validate credentials before testing
function validateCredentials(user: string | null, password: string | null, context: "smtp" | "imap"): string[] {
  const warnings: string[] = [];

  if (!user) {
    warnings.push(`${context.toUpperCase()} username is not set`);
  } else if (!user.includes("@") && context === "imap") {
    warnings.push(`${context.toUpperCase()} username "${user}" doesn't look like an email - some providers require full email address`);
  }

  if (!password) {
    warnings.push(`${context.toUpperCase()} password is not set`);
  } else {
    if (password.length < 8) {
      warnings.push(`${context.toUpperCase()} password seems short (${password.length} chars) - app passwords are usually 16+ chars`);
    }
    if (password.trim() !== password) {
      warnings.push(`${context.toUpperCase()} password has leading or trailing whitespace - this often causes auth failures`);
    }
    if (password.includes(" ") && password.length < 20) {
      warnings.push(`${context.toUpperCase()} password contains spaces - make sure this is intentional`);
    }
  }

  return warnings;
}

// Helper to get human-readable error explanation
function getHumanReadableError(error: string, context: "smtp" | "imap"): string {
  const lowerError = error.toLowerCase();

  if (lowerError.includes("timeout") || lowerError.includes("etimedout")) {
    return context === "imap"
      ? "Connection timed out. This usually means: 1) The server is blocking the connection, 2) Wrong port number (IMAP typically uses 993 for SSL or 143 for non-SSL), 3) Firewall blocking the connection, or 4) The server is not responding."
      : "Connection timed out. Check if the SMTP server is accessible and the port is correct (typically 587 for TLS or 465 for SSL).";
  }

  if (lowerError.includes("econnrefused")) {
    return `Connection refused. The ${context.toUpperCase()} server is not accepting connections on this port. Verify the host and port are correct.`;
  }

  if (lowerError.includes("auth") || lowerError.includes("login") || lowerError.includes("credential") || lowerError.includes("invalid")) {
    return "Authentication failed. Check your username and password. Make sure you're using an app-specific password if 2FA is enabled. For Gmail/Google Workspace, you need to enable 'Less secure apps' or use an App Password.";
  }

  if (lowerError.includes("certificate") || lowerError.includes("ssl") || lowerError.includes("tls")) {
    return "SSL/TLS certificate error. Try toggling the 'Use SSL/TLS' setting or check if the server requires a specific security configuration.";
  }

  if (lowerError.includes("enotfound") || lowerError.includes("getaddrinfo")) {
    return `Cannot find server. The hostname might be incorrect or DNS is not resolving. Verify the ${context.toUpperCase()} host address.`;
  }

  if (lowerError.includes("self signed") || lowerError.includes("self-signed")) {
    return "Server is using a self-signed certificate. This is handled automatically, but if issues persist, check your SSL settings.";
  }

  return error;
}

// Test IMAP connection with detailed step-by-step logging
async function testImapConnection(
  config: {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
  },
  channelId: string,
  channelName: string
): Promise<{ success: boolean; message: string; duration: number }> {
  const startTime = Date.now();

  // Step 1: Validate credentials
  const credWarnings = validateCredentials(config.user, config.password, "imap");
  if (credWarnings.length > 0) {
    for (const warning of credWarnings) {
      await emailLogger.warn(`⚠️ ${warning}`, { channelId, channelName });
    }
  }

  // Log credential info (masked)
  await emailLogger.connection(`🔐 IMAP Credentials: user="${config.user}", password=${maskPassword(config.password)}`, {
    channelId,
    channelName,
    level: "DEBUG",
  });

  // Step 2: DNS lookup
  await emailLogger.connection(`🔍 Step 1: Resolving hostname ${config.host}...`, { channelId, channelName });

  return new Promise((resolve) => {
    const imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 30000,
      authTimeout: 30000,
      debug: (info: string) => {
        // Log IMAP debug info for troubleshooting
        if (info.includes("LOGIN") || info.includes("AUTHENTICATE")) {
          emailLogger.connection(`🔑 Step 3: Authenticating...`, { channelId, channelName, level: "DEBUG" });
        } else if (info.includes("OK") && info.includes("authenticated")) {
          emailLogger.connection(`✅ Authentication successful!`, { channelId, channelName, level: "DEBUG" });
        }
      },
    });

    let connectionEstablished = false;

    const cleanup = () => {
      try {
        imap.end();
      } catch {
        // Ignore cleanup errors
      }
    };

    imap.once("ready", () => {
      const duration = Date.now() - startTime;
      connectionEstablished = true;

      emailLogger.connection(`✅ Step 4: IMAP ready! Connection fully established.`, {
        channelId,
        channelName,
        duration,
      });

      cleanup();
      resolve({
        success: true,
        message: `IMAP connection successful! Connected and authenticated in ${formatDuration(duration)}.`,
        duration,
      });
    });

    imap.once("error", (err: Error) => {
      const duration = Date.now() - startTime;
      const errorMsg = err.message;

      // Determine which step failed
      let step = "unknown step";
      if (duration < 1000 && !connectionEstablished) {
        step = "DNS/initial connection";
      } else if (errorMsg.toLowerCase().includes("auth") || errorMsg.toLowerCase().includes("login") || errorMsg.toLowerCase().includes("invalid")) {
        step = "authentication";
      } else if (duration > 25000) {
        step = "connection (timeout)";
      } else {
        step = "connection/handshake";
      }

      emailLogger.error(`❌ Failed at ${step}: ${errorMsg}`, {
        channelId,
        channelName,
        duration,
        details: { step, originalError: errorMsg },
      });

      cleanup();
      resolve({
        success: false,
        message: getHumanReadableError(errorMsg, "imap"),
        duration,
      });
    });

    // Log connection attempt
    emailLogger.connection(`🔌 Step 2: Connecting to ${config.host}:${config.port} (${config.tls ? "SSL/TLS" : "plain"})...`, {
      channelId,
      channelName,
    });

    imap.connect();
  });
}

// Test SMTP connection with detailed step-by-step logging
async function testSmtpConnection(
  config: {
    host: string;
    port: number;
    secure: boolean;
    user: string | null;
    password: string | null;
  },
  channelId: string,
  channelName: string
): Promise<{ success: boolean; message: string; duration: number }> {
  const startTime = Date.now();

  // Step 1: Validate credentials
  if (config.user && config.password) {
    const credWarnings = validateCredentials(config.user, config.password, "smtp");
    if (credWarnings.length > 0) {
      for (const warning of credWarnings) {
        await emailLogger.warn(`⚠️ ${warning}`, { channelId, channelName });
      }
    }

    // Log credential info (masked)
    await emailLogger.connection(`🔐 SMTP Credentials: user="${config.user}", password=${maskPassword(config.password)}`, {
      channelId,
      channelName,
      level: "DEBUG",
    });
  } else {
    await emailLogger.warn(`⚠️ SMTP authentication not configured - will attempt anonymous connection`, {
      channelId,
      channelName,
    });
  }

  // Step 2: Port validation
  const expectedSecure = config.port === 465;
  if (config.secure !== expectedSecure) {
    const hint = config.port === 465
      ? "Port 465 typically requires SSL/TLS to be enabled"
      : config.port === 587
        ? "Port 587 typically uses STARTTLS (SSL/TLS can be off, encryption happens after connection)"
        : `Port ${config.port} is non-standard for SMTP`;
    await emailLogger.warn(`⚠️ Port/SSL mismatch hint: ${hint}`, { channelId, channelName });
  }

  try {
    // Step 3: DNS lookup
    await emailLogger.connection(`🔍 Step 1: Resolving hostname ${config.host}...`, { channelId, channelName });

    try {
      const mxRecords = await resolveMx(config.host.replace(/^(smtp|mail)\./, ""));
      if (mxRecords && mxRecords.length > 0) {
        await emailLogger.connection(`✅ DNS resolved. MX records found for domain.`, {
          channelId,
          channelName,
          level: "DEBUG",
          details: { mxRecords: mxRecords.slice(0, 3).map(r => r.exchange) }
        });
      }
    } catch {
      // MX lookup failed, but that's OK - we're connecting directly to SMTP server
      await emailLogger.connection(`ℹ️ No MX records (connecting directly to SMTP server)`, {
        channelId,
        channelName,
        level: "DEBUG"
      });
    }

    // Step 4: Create transporter and connect
    await emailLogger.connection(`🔌 Step 2: Connecting to ${config.host}:${config.port} (${config.secure ? "SSL/TLS" : "STARTTLS"})...`, {
      channelId,
      channelName,
    });

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      auth: config.user && config.password
        ? { user: config.user, pass: config.password }
        : undefined,
      logger: false,
      debug: false,
    });

    // Step 5: Verify connection
    await emailLogger.connection(`🔑 Step 3: Verifying connection and authentication...`, { channelId, channelName });

    await transporter.verify();

    const duration = Date.now() - startTime;

    await emailLogger.connection(`✅ Step 4: SMTP ready! Server accepted connection.`, {
      channelId,
      channelName,
      duration,
    });

    return {
      success: true,
      message: `SMTP connected and verified in ${formatDuration(duration)}. Ready to send emails.`,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Determine which step likely failed
    let step = "unknown";
    if (duration < 1000) {
      step = "DNS/initial connection";
    } else if (errorMessage.toLowerCase().includes("auth") || errorMessage.toLowerCase().includes("credentials") || errorMessage.toLowerCase().includes("invalid")) {
      step = "authentication";
    } else if (duration > 25000) {
      step = "connection (timeout)";
    } else {
      step = "connection/handshake";
    }

    await emailLogger.error(`❌ SMTP failed at ${step}: ${errorMessage}`, {
      channelId,
      channelName,
      duration,
      details: { step, originalError: errorMessage },
    });

    return {
      success: false,
      message: getHumanReadableError(errorMessage, "smtp"),
      duration,
    };
  }
}

// Test Mailgun API connection
async function testMailgunApi(
  channelId: string,
  channelName: string
): Promise<{ success: boolean; message: string; duration: number }> {
  const startTime = Date.now();
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    return {
      success: false,
      message: "Mailgun API not configured (MAILGUN_API_KEY or MAILGUN_DOMAIN missing)",
      duration: Date.now() - startTime,
    };
  }

  await emailLogger.connection(`🔍 Testing Mailgun API for domain: ${domain}`, {
    channelId,
    channelName,
  });

  try {
    // Test API connectivity by fetching domain info
    const baseUrl = process.env.MAILGUN_EU === "true"
      ? "https://api.eu.mailgun.net/v3"
      : "https://api.mailgun.net/v3";

    const response = await fetch(`${baseUrl}/domains/${domain}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      },
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      await emailLogger.connection(`✅ Mailgun API connected successfully (${formatDuration(duration)})`, {
        channelId,
        channelName,
        duration,
      });
      return {
        success: true,
        message: `Mailgun API ready! Domain ${domain} verified. Emails will be sent via Mailgun HTTP API.`,
        duration,
      };
    } else {
      const errorText = await response.text();
      await emailLogger.error(`❌ Mailgun API error: ${response.status} - ${errorText}`, {
        channelId,
        channelName,
        duration,
      });
      return {
        success: false,
        message: `Mailgun API error (${response.status}): ${errorText}`,
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await emailLogger.error(`❌ Mailgun API request failed: ${errorMessage}`, {
      channelId,
      channelName,
      duration,
    });
    return {
      success: false,
      message: `Mailgun API connection failed: ${errorMessage}`,
      duration,
    };
  }
}

// POST /api/admin/email-channels/[id]/test - Test email channel connection (Mailgun/SMTP + IMAP)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let channelId: string | undefined;
  let channelName: string | undefined;

  try {
    const { id } = await params;
    channelId = id;

    const channel = await prisma.emailChannel.findUnique({
      where: { id },
    });

    if (!channel) {
      await emailLogger.error("❌ Channel not found", {
        channelId: id,
        details: { error: "Email channel not found in database" },
      });
      return NextResponse.json(
        { error: "Email channel not found" },
        { status: 404 }
      );
    }

    channelName = channel.name || channel.email;
    const results: {
      mailgun?: { success: boolean; message: string };
      smtp?: { success: boolean; message: string };
      imap?: { success: boolean; message: string }
    } = {};

    await emailLogger.info(`🔍 ═══════════════════════════════════════════════════`, {
      channelId: channel.id,
      channelName,
    });
    await emailLogger.info(`🔍 Starting connection test for "${channelName}"`, {
      channelId: channel.id,
      channelName,
    });
    await emailLogger.info(`🔍 ═══════════════════════════════════════════════════`, {
      channelId: channel.id,
      channelName,
    });

    // Test Mailgun API first (preferred for cloud hosts)
    const hasMailgun = process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN;
    if (hasMailgun) {
      await emailLogger.info(`\n📧 ─── MAILGUN API TEST (Outgoing Mail - Primary) ───`, {
        channelId: channel.id,
        channelName,
      });

      const mailgunResult = await testMailgunApi(channel.id, channelName);
      results.mailgun = { success: mailgunResult.success, message: mailgunResult.message };

      if (mailgunResult.success) {
        await emailLogger.connection(`\n✅ MAILGUN TEST PASSED in ${formatDuration(mailgunResult.duration)}`, {
          channelId: channel.id,
          channelName,
          duration: mailgunResult.duration,
        });
      } else {
        await emailLogger.error(`\n❌ MAILGUN TEST FAILED after ${formatDuration(mailgunResult.duration)}`, {
          channelId: channel.id,
          channelName,
          duration: mailgunResult.duration,
        });
      }
    }

    // Test SMTP if configured (fallback or if Mailgun not configured)
    if (channel.smtpHost && channel.smtpPort) {
      await emailLogger.info(`\n📤 ─── SMTP TEST (Outgoing Mail) ───`, {
        channelId: channel.id,
        channelName,
      });
      await emailLogger.connection(`📤 Server: ${channel.smtpHost}:${channel.smtpPort}`, {
        channelId: channel.id,
        channelName,
        details: {
          host: channel.smtpHost,
          port: channel.smtpPort,
          secure: channel.smtpSecure,
          user: channel.smtpUser || "not set",
        },
      });

      const smtpResult = await testSmtpConnection(
        {
          host: channel.smtpHost,
          port: channel.smtpPort,
          secure: channel.smtpSecure,
          user: channel.smtpUser,
          password: channel.smtpPassword,
        },
        channel.id,
        channelName
      );

      results.smtp = { success: smtpResult.success, message: smtpResult.message };

      if (smtpResult.success) {
        await emailLogger.connection(`\n✅ SMTP TEST PASSED in ${formatDuration(smtpResult.duration)}`, {
          channelId: channel.id,
          channelName,
          duration: smtpResult.duration,
        });
      } else {
        await emailLogger.error(`\n❌ SMTP TEST FAILED after ${formatDuration(smtpResult.duration)}`, {
          channelId: channel.id,
          channelName,
          duration: smtpResult.duration,
        });
      }
    } else {
      await emailLogger.warn("\n⚠️ SMTP not configured - skipping outgoing mail test", {
        channelId: channel.id,
        channelName,
        details: {
          smtpHost: channel.smtpHost || "not set",
          smtpPort: channel.smtpPort || "not set",
        },
      });
      results.smtp = { success: false, message: "SMTP not configured" };
    }

    // Test IMAP if configured
    if (channel.imapHost && channel.imapPort && channel.imapUser && channel.imapPassword) {
      await emailLogger.info(`\n📥 ─── IMAP TEST (Incoming Mail) ───`, {
        channelId: channel.id,
        channelName,
      });
      await emailLogger.connection(`📥 Server: ${channel.imapHost}:${channel.imapPort}`, {
        channelId: channel.id,
        channelName,
        details: {
          host: channel.imapHost,
          port: channel.imapPort,
          secure: channel.imapSecure,
          user: channel.imapUser,
        },
      });

      const imapResult = await testImapConnection(
        {
          user: channel.imapUser,
          password: channel.imapPassword,
          host: channel.imapHost,
          port: channel.imapPort,
          tls: channel.imapSecure,
        },
        channel.id,
        channelName
      );

      results.imap = { success: imapResult.success, message: imapResult.message };

      if (imapResult.success) {
        await emailLogger.connection(`\n✅ IMAP TEST PASSED in ${formatDuration(imapResult.duration)}`, {
          channelId: channel.id,
          channelName,
          duration: imapResult.duration,
        });
      } else {
        await emailLogger.error(`\n❌ IMAP TEST FAILED after ${formatDuration(imapResult.duration)}`, {
          channelId: channel.id,
          channelName,
          duration: imapResult.duration,
          details: {
            host: channel.imapHost,
            port: channel.imapPort,
            suggestion: channel.imapPort === 993
              ? "Port 993 is correct for IMAP SSL. Check if your email provider allows IMAP access and that you're using an app-specific password."
              : channel.imapPort === 143
                ? "Port 143 is for non-SSL IMAP. Try port 993 with SSL enabled if this doesn't work."
                : `Port ${channel.imapPort} is unusual for IMAP. Standard ports are 993 (SSL) or 143 (non-SSL).`
          },
        });
      }
    } else {
      await emailLogger.warn("\n⚠️ IMAP not configured - skipping incoming mail test", {
        channelId: channel.id,
        channelName,
        details: {
          imapHost: channel.imapHost || "not set",
          imapPort: channel.imapPort || "not set",
          imapUser: channel.imapUser ? "configured" : "not set",
          imapPassword: channel.imapPassword ? "configured" : "not set",
        },
      });
      results.imap = { success: false, message: "IMAP not configured" };
    }

    const totalDuration = Date.now() - startTime;

    // For outgoing mail: Mailgun OR SMTP must work (or neither configured)
    const outgoingWorks = results.mailgun?.success || results.smtp?.success || (!hasMailgun && !channel.smtpHost);
    // For incoming mail: IMAP must work (or not configured)
    const incomingWorks = results.imap?.success || !channel.imapHost;
    const overallSuccess = outgoingWorks && incomingWorks;

    // Summary log
    await emailLogger.info(`\n🔍 ═══════════════════════════════════════════════════`, {
      channelId: channel.id,
      channelName,
    });
    await emailLogger.info(
      overallSuccess
        ? `✅ TEST COMPLETE: All configured protocols working! (${formatDuration(totalDuration)})`
        : `⚠️ TEST COMPLETE: Some issues detected (${formatDuration(totalDuration)})`,
      {
        channelId: channel.id,
        channelName,
        duration: totalDuration,
        details: {
          mailgun: results.mailgun?.success ? "✓ PASSED" : results.mailgun?.message || "not configured",
          smtp: results.smtp?.success ? "✓ PASSED" : results.smtp?.message || "not tested",
          imap: results.imap?.success ? "✓ PASSED" : results.imap?.message || "not tested",
        },
      }
    );
    await emailLogger.info(`🔍 ═══════════════════════════════════════════════════\n`, {
      channelId: channel.id,
      channelName,
    });

    // Build response message
    const messages: string[] = [];
    if (results.mailgun) {
      messages.push(`Mailgun API: ${results.mailgun.success ? "✓" : "✗"} ${results.mailgun.message}`);
    }
    if (results.smtp) {
      // If Mailgun works, SMTP failure is just informational
      const prefix = results.mailgun?.success ? "SMTP (fallback)" : "SMTP";
      messages.push(`${prefix}: ${results.smtp.success ? "✓" : "✗"} ${results.smtp.message}`);
    }
    if (results.imap) {
      messages.push(`IMAP: ${results.imap.success ? "✓" : "✗"} ${results.imap.message}`);
    }

    return NextResponse.json({
      success: overallSuccess,
      message: messages.join("\n\n"),
      details: results,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await emailLogger.error(`❌ Connection test failed unexpectedly: ${errorMessage}`, {
      channelId,
      channelName,
      duration,
      details: {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    console.error("Failed to test email channel:", error);
    return NextResponse.json(
      {
        error: "Connection failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
