import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import Imap from "imap";
import { emailLogger } from "@/lib/email-activity-logger";

// Helper to format duration in human readable format
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
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

  if (lowerError.includes("auth") || lowerError.includes("login") || lowerError.includes("credential")) {
    return "Authentication failed. Check your username and password. Make sure you're using an app-specific password if 2FA is enabled.";
  }

  if (lowerError.includes("certificate") || lowerError.includes("ssl") || lowerError.includes("tls")) {
    return "SSL/TLS certificate error. Try toggling the 'Use SSL/TLS' setting or check if the server requires a specific security configuration.";
  }

  if (lowerError.includes("enotfound") || lowerError.includes("getaddrinfo")) {
    return `Cannot find server. The hostname might be incorrect or DNS is not resolving. Verify the ${context.toUpperCase()} host address.`;
  }

  return error;
}

// Test IMAP connection with a promise wrapper
function testImapConnection(config: {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}): Promise<{ success: boolean; message: string; duration: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 30000, // 30 second timeout
      authTimeout: 30000,
    });

    const cleanup = () => {
      try {
        imap.end();
      } catch {
        // Ignore cleanup errors
      }
    };

    imap.once("ready", () => {
      const duration = Date.now() - startTime;
      cleanup();
      resolve({
        success: true,
        message: `IMAP connection successful! Connected in ${formatDuration(duration)}.`,
        duration,
      });
    });

    imap.once("error", (err: Error) => {
      const duration = Date.now() - startTime;
      cleanup();
      resolve({
        success: false,
        message: getHumanReadableError(err.message, "imap"),
        duration,
      });
    });

    imap.connect();
  });
}

// POST /api/admin/email-channels/[id]/test - Test email channel connection (SMTP + IMAP)
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
    const results: { smtp?: { success: boolean; message: string }; imap?: { success: boolean; message: string } } = {};

    await emailLogger.info(`🔍 Starting connection test for "${channelName}"`, {
      channelId: channel.id,
      channelName,
    });

    // Test SMTP if configured
    if (channel.smtpHost && channel.smtpPort) {
      await emailLogger.connection(`📤 Testing SMTP (outgoing mail) → ${channel.smtpHost}:${channel.smtpPort}...`, {
        channelId: channel.id,
        channelName,
        details: {
          host: channel.smtpHost,
          port: channel.smtpPort,
          secure: channel.smtpSecure,
          user: channel.smtpUser ? "configured" : "not set"
        },
      });

      try {
        const smtpStart = Date.now();
        const transporter = nodemailer.createTransport({
          host: channel.smtpHost,
          port: channel.smtpPort,
          secure: channel.smtpSecure,
          connectionTimeout: 30000,
          auth: channel.smtpUser && channel.smtpPassword
            ? { user: channel.smtpUser, pass: channel.smtpPassword }
            : undefined,
        });

        await transporter.verify();
        const smtpDuration = Date.now() - smtpStart;

        results.smtp = {
          success: true,
          message: `SMTP connected successfully in ${formatDuration(smtpDuration)}`
        };

        await emailLogger.connection(`✅ SMTP connection successful! Ready to send emails.`, {
          channelId: channel.id,
          channelName,
          duration: smtpDuration,
        });
      } catch (error) {
        const smtpDuration = Date.now() - smtpStart;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        results.smtp = {
          success: false,
          message: getHumanReadableError(errorMessage, "smtp")
        };

        await emailLogger.error(`❌ SMTP connection failed: ${getHumanReadableError(errorMessage, "smtp")}`, {
          channelId: channel.id,
          channelName,
          duration: smtpDuration,
          details: { originalError: errorMessage },
        });
      }
    } else {
      await emailLogger.warn("⚠️ SMTP not configured - skipping outgoing mail test", {
        channelId: channel.id,
        channelName,
      });
      results.smtp = { success: false, message: "SMTP not configured" };
    }

    // Test IMAP if configured
    if (channel.imapHost && channel.imapPort && channel.imapUser && channel.imapPassword) {
      await emailLogger.connection(`📥 Testing IMAP (incoming mail) → ${channel.imapHost}:${channel.imapPort}...`, {
        channelId: channel.id,
        channelName,
        details: {
          host: channel.imapHost,
          port: channel.imapPort,
          secure: channel.imapSecure,
          user: channel.imapUser
        },
      });

      const imapResult = await testImapConnection({
        user: channel.imapUser,
        password: channel.imapPassword,
        host: channel.imapHost,
        port: channel.imapPort,
        tls: channel.imapSecure,
      });

      results.imap = { success: imapResult.success, message: imapResult.message };

      if (imapResult.success) {
        await emailLogger.connection(`✅ IMAP connection successful! Ready to receive emails.`, {
          channelId: channel.id,
          channelName,
          duration: imapResult.duration,
        });
      } else {
        await emailLogger.error(`❌ IMAP connection failed: ${imapResult.message}`, {
          channelId: channel.id,
          channelName,
          duration: imapResult.duration,
          details: {
            host: channel.imapHost,
            port: channel.imapPort,
            suggestion: channel.imapPort === 993
              ? "Port 993 is correct for IMAP SSL. Check if your email provider allows IMAP access and that you're using the correct credentials."
              : channel.imapPort === 143
                ? "Port 143 is for non-SSL IMAP. Try port 993 with SSL enabled if this doesn't work."
                : `Port ${channel.imapPort} is unusual for IMAP. Standard ports are 993 (SSL) or 143 (non-SSL).`
          },
        });
      }
    } else {
      await emailLogger.warn("⚠️ IMAP not configured - skipping incoming mail test", {
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
    const overallSuccess = (results.smtp?.success || !channel.smtpHost) && (results.imap?.success || !channel.imapHost);

    // Summary log
    await emailLogger.info(
      overallSuccess
        ? `✅ Connection test completed successfully for "${channelName}" in ${formatDuration(totalDuration)}`
        : `⚠️ Connection test completed with issues for "${channelName}" in ${formatDuration(totalDuration)}`,
      {
        channelId: channel.id,
        channelName,
        duration: totalDuration,
        details: {
          smtp: results.smtp,
          imap: results.imap,
        },
      }
    );

    // Build response message
    const messages: string[] = [];
    if (results.smtp) {
      messages.push(`SMTP: ${results.smtp.success ? "✓" : "✗"} ${results.smtp.message}`);
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
