import nodemailer from "nodemailer";
import { prisma } from "./db";

interface EmailData {
  ticketNumber?: number;
  subject?: string;
  contactName?: string;
  contactEmail?: string;
  agentName?: string;
  messageBody?: string;
  portalUrl?: string;
  resetLink?: string;
  newStatus?: string;
  priority?: string;
  assigneeName?: string;
}

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(template: string, data: EmailData): string {
  const portalUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return template
    .replace(/\{\{ticketNumber\}\}/g, data.ticketNumber?.toString() || "")
    .replace(/\{\{subject\}\}/g, data.subject || "")
    .replace(/\{\{contactName\}\}/g, data.contactName || "Customer")
    .replace(/\{\{contactEmail\}\}/g, data.contactEmail || "")
    .replace(/\{\{agentName\}\}/g, data.agentName || "Support Agent")
    .replace(/\{\{messageBody\}\}/g, data.messageBody || "")
    .replace(/\{\{portalUrl\}\}/g, data.portalUrl || portalUrl)
    .replace(/\{\{resetLink\}\}/g, data.resetLink || "")
    .replace(/\{\{newStatus\}\}/g, data.newStatus || "")
    .replace(/\{\{priority\}\}/g, data.priority || "")
    .replace(/\{\{assigneeName\}\}/g, data.assigneeName || "Unassigned");
}

/**
 * Get the default email channel for sending emails
 */
async function getDefaultEmailChannel() {
  let channel = await prisma.emailChannel.findFirst({
    where: { isDefault: true, isActive: true },
  });

  if (!channel) {
    channel = await prisma.emailChannel.findFirst({
      where: { isActive: true },
    });
  }

  return channel;
}

/**
 * Create nodemailer transporter from email channel or environment
 */
function createTransporter(channel?: {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpSecure: boolean;
} | null) {
  // Check for Resend API key in environment
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: resendApiKey,
      },
    });
  }

  // Check for environment SMTP settings
  const envSmtpHost = process.env.SMTP_HOST;
  const envSmtpPort = process.env.SMTP_PORT;
  const envSmtpUser = process.env.SMTP_USER;
  const envSmtpPass = process.env.SMTP_PASSWORD;

  if (envSmtpHost && envSmtpPort) {
    return nodemailer.createTransport({
      host: envSmtpHost,
      port: parseInt(envSmtpPort),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        envSmtpUser && envSmtpPass
          ? { user: envSmtpUser, pass: envSmtpPass }
          : undefined,
    });
  }

  // Fall back to database channel settings
  if (!channel?.smtpHost || !channel?.smtpPort) {
    throw new Error("SMTP not configured. Set RESEND_API_KEY, SMTP_* env vars, or configure an email channel.");
  }

  return nodemailer.createTransport({
    host: channel.smtpHost,
    port: channel.smtpPort,
    secure: channel.smtpSecure,
    auth:
      channel.smtpUser && channel.smtpPassword
        ? { user: channel.smtpUser, pass: channel.smtpPassword }
        : undefined,
  });
}

/**
 * Get the "from" address for sending emails
 */
function getFromAddress(channel?: { name: string; email: string } | null): string {
  const envFromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  const envFromName = process.env.EMAIL_FROM_NAME || "Support";

  if (envFromEmail) {
    return `"${envFromName}" <${envFromEmail}>`;
  }

  if (channel) {
    return `"${channel.name}" <${channel.email}>`;
  }

  return `"Support" <noreply@example.com>`;
}

/**
 * Send an email using a template
 */
export async function sendTemplatedEmail(
  templateSlug: string,
  to: string,
  data: EmailData,
  ticketId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { slug: templateSlug },
    });

    if (!template || !template.isActive) {
      console.log(`Email template "${templateSlug}" not found or inactive`);
      return { success: false, error: "Template not found or inactive" };
    }

    const channel = await getDefaultEmailChannel();
    const transporter = createTransporter(channel);

    const subject = replaceTemplateVariables(template.subject, data);
    const html = replaceTemplateVariables(template.body, data);

    await transporter.sendMail({
      from: getFromAddress(channel),
      to,
      subject,
      html,
    });

    await prisma.emailLog.create({
      data: { ticketId, to, subject, status: "SENT" },
    });

    console.log(`Email sent successfully to ${to} using template "${templateSlug}"`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);

    await prisma.emailLog.create({
      data: {
        ticketId,
        to,
        subject: `[${templateSlug}]`,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Send a raw email (no template)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  ticketId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const channel = await getDefaultEmailChannel();
    const transporter = createTransporter(channel);

    await transporter.sendMail({
      from: getFromAddress(channel),
      to,
      subject,
      html,
    });

    await prisma.emailLog.create({
      data: { ticketId, to, subject, status: "SENT" },
    });

    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);

    await prisma.emailLog.create({
      data: {
        ticketId,
        to,
        subject,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Queue an email for sending
 */
export async function queueEmail(
  to: string,
  subject: string,
  body: string,
  templateId?: string,
  variables?: Record<string, string>
): Promise<void> {
  await prisma.emailQueue.create({
    data: {
      to,
      subject,
      body,
      templateId,
      variables: variables ? JSON.stringify(variables) : null,
      status: "PENDING",
    },
  });
}

/**
 * Process queued emails
 */
export async function processEmailQueue(limit = 10): Promise<number> {
  const pendingEmails = await prisma.emailQueue.findMany({
    where: {
      status: "PENDING",
      attempts: { lt: 3 },
      scheduledAt: { lte: new Date() },
    },
    take: limit,
    orderBy: { scheduledAt: "asc" },
  });

  let sent = 0;

  for (const email of pendingEmails) {
    try {
      const result = await sendEmail(email.to, email.subject, email.body);

      if (result.success) {
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: { status: "SENT", sentAt: new Date() },
        });
        sent++;
      } else {
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            attempts: { increment: 1 },
            error: result.error,
            status: email.attempts >= 2 ? "FAILED" : "PENDING",
          },
        });
      }
    } catch (error) {
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          attempts: { increment: 1 },
          error: error instanceof Error ? error.message : "Unknown error",
          status: email.attempts >= 2 ? "FAILED" : "PENDING",
        },
      });
    }
  }

  return sent;
}

// Notification Functions

export async function sendTicketCreatedEmail(ticket: {
  id: string;
  ticketNumber: number;
  subject: string;
  contact: { name: string | null; email: string } | null;
}) {
  if (!ticket.contact?.email) {
    return { success: false, error: "No contact email" };
  }

  return sendTemplatedEmail(
    "ticket_created",
    ticket.contact.email,
    {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      contactName: ticket.contact.name || "Customer",
      contactEmail: ticket.contact.email,
    },
    ticket.id
  );
}

export async function sendAgentReplyEmail(
  ticket: {
    id: string;
    ticketNumber: number;
    subject: string;
    contact: { name: string | null; email: string } | null;
  },
  agentName: string,
  messageBody: string
) {
  if (!ticket.contact?.email) {
    return { success: false, error: "No contact email" };
  }

  return sendTemplatedEmail(
    "agent_reply",
    ticket.contact.email,
    {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      contactName: ticket.contact.name || "Customer",
      contactEmail: ticket.contact.email,
      agentName,
      messageBody,
    },
    ticket.id
  );
}

export async function sendTicketStatusChangedEmail(
  ticket: {
    id: string;
    ticketNumber: number;
    subject: string;
    contact: { name: string | null; email: string } | null;
  },
  newStatus: string
) {
  if (!ticket.contact?.email) {
    return { success: false, error: "No contact email" };
  }

  return sendTemplatedEmail(
    "ticket_status_changed",
    ticket.contact.email,
    {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      contactName: ticket.contact.name || "Customer",
      contactEmail: ticket.contact.email,
      newStatus,
    },
    ticket.id
  );
}

export async function sendTicketResolvedEmail(ticket: {
  id: string;
  ticketNumber: number;
  subject: string;
  contact: { name: string | null; email: string } | null;
}) {
  if (!ticket.contact?.email) {
    return { success: false, error: "No contact email" };
  }

  return sendTemplatedEmail(
    "ticket_resolved",
    ticket.contact.email,
    {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      contactName: ticket.contact.name || "Customer",
      contactEmail: ticket.contact.email,
    },
    ticket.id
  );
}

export async function sendTicketClosedEmail(ticket: {
  id: string;
  ticketNumber: number;
  subject: string;
  contact: { name: string | null; email: string } | null;
}) {
  if (!ticket.contact?.email) {
    return { success: false, error: "No contact email" };
  }

  return sendTemplatedEmail(
    "ticket_closed",
    ticket.contact.email,
    {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      contactName: ticket.contact.name || "Customer",
      contactEmail: ticket.contact.email,
    },
    ticket.id
  );
}

export async function sendPasswordResetEmail(
  email: string,
  name: string | null,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  const portalUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetLink = `${portalUrl}/portal/reset-password?token=${resetToken}`;

  return sendTemplatedEmail("password_reset", email, {
    contactName: name || "Customer",
    contactEmail: email,
    resetLink,
    portalUrl,
  });
}

export async function sendTicketAssignedEmail(
  agentEmail: string,
  agentName: string,
  ticket: {
    id: string;
    ticketNumber: number;
    subject: string;
    priority: string;
    contact: { name: string | null; email: string } | null;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendTemplatedEmail(
    "ticket_assigned",
    agentEmail,
    {
      agentName,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      priority: ticket.priority,
      contactName: ticket.contact?.name || "Customer",
      contactEmail: ticket.contact?.email || "",
    },
    ticket.id
  );
}

export async function sendSLABreachWarningEmail(
  agentEmail: string,
  agentName: string,
  ticket: {
    id: string;
    ticketNumber: number;
    subject: string;
    priority: string;
  },
  breachType: "first_response" | "resolution"
): Promise<{ success: boolean; error?: string }> {
  return sendTemplatedEmail(
    "sla_breach_warning",
    agentEmail,
    {
      agentName,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      priority: ticket.priority,
      messageBody:
        breachType === "first_response"
          ? "First response SLA is about to breach"
          : "Resolution SLA is about to breach",
    },
    ticket.id
  );
}

export async function sendCustomerReplyEmail(
  agentEmail: string,
  agentName: string,
  ticket: {
    id: string;
    ticketNumber: number;
    subject: string;
    contact: { name: string | null; email: string } | null;
  },
  messageBody: string
): Promise<{ success: boolean; error?: string }> {
  return sendTemplatedEmail(
    "customer_reply",
    agentEmail,
    {
      agentName,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      contactName: ticket.contact?.name || "Customer",
      contactEmail: ticket.contact?.email || "",
      messageBody,
    },
    ticket.id
  );
}
