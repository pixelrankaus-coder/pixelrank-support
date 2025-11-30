import { prisma } from "@/lib/db";
import { EmailChannelClient } from "./email-channel-client";

export default async function EmailChannelPage() {
  const [emailChannels, emailTemplates] = await Promise.all([
    prisma.emailChannel.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  // Create default templates if none exist
  if (emailTemplates.length === 0) {
    await prisma.emailTemplate.createMany({
      data: [
        {
          name: "Ticket Created",
          slug: "ticket_created",
          subject: "Ticket #{{ticketNumber}} - {{subject}}",
          body: `<p>Hello {{contactName}},</p>
<p>Thank you for contacting us. We have received your request and created ticket #{{ticketNumber}}.</p>
<p><strong>Subject:</strong> {{subject}}</p>
<p>Our support team will review your request and get back to you as soon as possible.</p>
<p>Best regards,<br>Support Team</p>`,
        },
        {
          name: "Agent Reply",
          slug: "agent_reply",
          subject: "Re: Ticket #{{ticketNumber}} - {{subject}}",
          body: `<p>Hello {{contactName}},</p>
<p>{{agentName}} has replied to your ticket:</p>
<hr>
{{messageBody}}
<hr>
<p>You can reply to this email to continue the conversation.</p>
<p>Best regards,<br>Support Team</p>`,
        },
        {
          name: "Ticket Resolved",
          slug: "ticket_resolved",
          subject: "Ticket #{{ticketNumber}} Resolved - {{subject}}",
          body: `<p>Hello {{contactName}},</p>
<p>Your ticket #{{ticketNumber}} has been marked as resolved.</p>
<p><strong>Subject:</strong> {{subject}}</p>
<p>If you have any further questions, feel free to reply to this email.</p>
<p>Best regards,<br>Support Team</p>`,
        },
        {
          name: "Ticket Closed",
          slug: "ticket_closed",
          subject: "Ticket #{{ticketNumber}} Closed - {{subject}}",
          body: `<p>Hello {{contactName}},</p>
<p>Your ticket #{{ticketNumber}} has been closed.</p>
<p><strong>Subject:</strong> {{subject}}</p>
<p>Thank you for contacting us. If you need further assistance, please create a new ticket.</p>
<p>Best regards,<br>Support Team</p>`,
        },
      ],
    });
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return <EmailChannelClient emailChannels={emailChannels} emailTemplates={templates} />;
}
