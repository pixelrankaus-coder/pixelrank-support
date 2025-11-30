import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const emailTemplates = [
    {
      slug: "ticket_created",
      name: "Ticket Created",
      subject: "[#{{ticketNumber}}] {{subject}} - Ticket Received",
      body: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#2563eb;color:white;padding:20px;text-align:center}.content{padding:20px;background:#f9fafb}.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h2>Ticket Received</h2></div><div class="content"><p>Hi {{contactName}},</p><p>Thank you for contacting us. We have received your request and created ticket <strong>#{{ticketNumber}}</strong>.</p><p><strong>Subject:</strong> {{subject}}</p><p>Our support team will review your request and get back to you as soon as possible.</p><p><a href="{{portalUrl}}/portal/tickets" style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">View Ticket</a></p></div><div class="footer"><p>This is an automated message.</p></div></div></body></html>`,
    },
    {
      slug: "agent_reply",
      name: "Agent Reply",
      subject: "Re: [#{{ticketNumber}}] {{subject}}",
      body: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#2563eb;color:white;padding:20px;text-align:center}.content{padding:20px;background:#f9fafb}.message{background:white;border-left:4px solid #2563eb;padding:15px;margin:15px 0}.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h2>New Reply on Ticket #{{ticketNumber}}</h2></div><div class="content"><p>Hi {{contactName}},</p><p><strong>{{agentName}}</strong> has replied to your ticket:</p><div class="message">{{messageBody}}</div><p><a href="{{portalUrl}}/portal/tickets" style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">View & Reply</a></p></div><div class="footer"><p>This is an automated message.</p></div></div></body></html>`,
    },
    {
      slug: "ticket_status_changed",
      name: "Status Changed",
      subject: "[#{{ticketNumber}}] Status Updated: {{newStatus}}",
      body: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#2563eb;color:white;padding:20px;text-align:center}.content{padding:20px;background:#f9fafb}.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h2>Ticket Status Updated</h2></div><div class="content"><p>Hi {{contactName}},</p><p>The status of your ticket <strong>#{{ticketNumber}}</strong> has been updated to <strong>{{newStatus}}</strong>.</p><p><strong>Subject:</strong> {{subject}}</p><p><a href="{{portalUrl}}/portal/tickets" style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">View Ticket</a></p></div><div class="footer"><p>This is an automated message.</p></div></div></body></html>`,
    },
    {
      slug: "ticket_resolved",
      name: "Ticket Resolved",
      subject: "[#{{ticketNumber}}] {{subject}} - Resolved",
      body: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#16a34a;color:white;padding:20px;text-align:center}.content{padding:20px;background:#f9fafb}.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h2>Ticket Resolved</h2></div><div class="content"><p>Hi {{contactName}},</p><p>Great news! Your ticket <strong>#{{ticketNumber}}</strong> has been resolved.</p><p><strong>Subject:</strong> {{subject}}</p><p>If you have any further questions, please feel free to reopen the ticket or create a new one.</p><p><a href="{{portalUrl}}/portal/tickets" style="display:inline-block;background:#16a34a;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">View Ticket</a></p></div><div class="footer"><p>Thank you for your patience!</p></div></div></body></html>`,
    },
    {
      slug: "ticket_closed",
      name: "Ticket Closed",
      subject: "[#{{ticketNumber}}] {{subject}} - Closed",
      body: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#6b7280;color:white;padding:20px;text-align:center}.content{padding:20px;background:#f9fafb}.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h2>Ticket Closed</h2></div><div class="content"><p>Hi {{contactName}},</p><p>Your ticket <strong>#{{ticketNumber}}</strong> has been closed.</p><p><strong>Subject:</strong> {{subject}}</p><p>If you need further assistance, you can create a new ticket at any time.</p><p><a href="{{portalUrl}}/portal/tickets/new" style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">Create New Ticket</a></p></div><div class="footer"><p>Thank you for contacting support!</p></div></div></body></html>`,
    },
    {
      slug: "password_reset",
      name: "Password Reset",
      subject: "Reset Your Password",
      body: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#2563eb;color:white;padding:20px;text-align:center}.content{padding:20px;background:#f9fafb}.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h2>Password Reset Request</h2></div><div class="content"><p>Hi {{contactName}},</p><p>We received a request to reset your password. Click the button below to set a new password:</p><p style="text-align:center"><a href="{{resetLink}}" style="display:inline-block;background:#2563eb;color:white;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:16px">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you didn't request a password reset, you can safely ignore this email.</p></div><div class="footer"><p>This is an automated message.</p></div></div></body></html>`,
    },
    {
      slug: "ticket_assigned",
      name: "Ticket Assigned (Agent)",
      subject: "[#{{ticketNumber}}] Ticket Assigned to You - {{priority}} Priority",
      body: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#7c3aed;color:white;padding:20px;text-align:center}.content{padding:20px;background:#f9fafb}.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h2>New Ticket Assigned</h2></div><div class="content"><p>Hi {{agentName}},</p><p>A new ticket has been assigned to you:</p><p><strong>Ticket:</strong> #{{ticketNumber}}</p><p><strong>Subject:</strong> {{subject}}</p><p><strong>Priority:</strong> {{priority}}</p><p><strong>Customer:</strong> {{contactName}} ({{contactEmail}})</p><p><a href="{{portalUrl}}/tickets/{{ticketNumber}}" style="display:inline-block;background:#7c3aed;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">View Ticket</a></p></div><div class="footer"><p>Helpdesk Notification</p></div></div></body></html>`,
    },
    {
      slug: "customer_reply",
      name: "Customer Reply (Agent)",
      subject: "[#{{ticketNumber}}] Customer Reply - {{subject}}",
      body: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#2563eb;color:white;padding:20px;text-align:center}.content{padding:20px;background:#f9fafb}.message{background:white;border-left:4px solid #f59e0b;padding:15px;margin:15px 0}.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h2>New Customer Reply</h2></div><div class="content"><p>Hi {{agentName}},</p><p><strong>{{contactName}}</strong> has replied to ticket #{{ticketNumber}}:</p><div class="message">{{messageBody}}</div><p><a href="{{portalUrl}}/tickets/{{ticketNumber}}" style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">View & Reply</a></p></div><div class="footer"><p>Helpdesk Notification</p></div></div></body></html>`,
    },
    {
      slug: "sla_breach_warning",
      name: "SLA Breach Warning",
      subject: "SLA Warning: Ticket #{{ticketNumber}} - {{priority}} Priority",
      body: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#dc2626;color:white;padding:20px;text-align:center}.content{padding:20px;background:#fef2f2}.warning{background:#fee2e2;border:1px solid #fca5a5;padding:15px;border-radius:5px;margin:15px 0}.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h2>SLA Breach Warning</h2></div><div class="content"><p>Hi {{agentName}},</p><div class="warning"><strong>{{messageBody}}</strong></div><p><strong>Ticket:</strong> #{{ticketNumber}}</p><p><strong>Subject:</strong> {{subject}}</p><p><strong>Priority:</strong> {{priority}}</p><p>Please respond to this ticket immediately to prevent an SLA breach.</p><p><a href="{{portalUrl}}/tickets/{{ticketNumber}}" style="display:inline-block;background:#dc2626;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">Respond Now</a></p></div><div class="footer"><p>Helpdesk SLA Alert</p></div></div></body></html>`,
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { slug: template.slug },
      update: { subject: template.subject, body: template.body },
      create: {
        slug: template.slug,
        name: template.name,
        subject: template.subject,
        body: template.body,
        isActive: true,
      },
    });
  }

  console.log("✅ Created/updated", emailTemplates.length, "email templates");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
