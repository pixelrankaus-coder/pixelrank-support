import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import { emailLogger } from "@/lib/email-activity-logger";

// POST /api/admin/email-channels/[id]/test - Test email channel connection
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
      await emailLogger.error("Channel not found for test", {
        channelId: id,
        details: { error: "Email channel not found" },
      });
      return NextResponse.json(
        { error: "Email channel not found" },
        { status: 404 }
      );
    }

    channelName = channel.name || channel.email;

    if (!channel.smtpHost || !channel.smtpPort) {
      await emailLogger.warn("SMTP not configured for test", {
        channelId: channel.id,
        channelName,
        details: { smtpHost: channel.smtpHost, smtpPort: channel.smtpPort },
      });
      return NextResponse.json(
        { error: "SMTP settings are not configured", message: "SMTP settings are not configured" },
        { status: 400 }
      );
    }

    await emailLogger.connection(`Testing SMTP connection to ${channel.smtpHost}:${channel.smtpPort}`, {
      channelId: channel.id,
      channelName,
      details: { host: channel.smtpHost, port: channel.smtpPort, secure: channel.smtpSecure },
    });

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: channel.smtpHost,
      port: channel.smtpPort,
      secure: channel.smtpSecure,
      auth: channel.smtpUser && channel.smtpPassword
        ? {
            user: channel.smtpUser,
            pass: channel.smtpPassword,
          }
        : undefined,
    });

    // Verify connection
    await transporter.verify();

    const duration = Date.now() - startTime;
    await emailLogger.connection("SMTP connection test successful", {
      channelId: channel.id,
      channelName,
      level: "INFO",
      duration,
      details: { host: channel.smtpHost, port: channel.smtpPort },
    });

    return NextResponse.json({
      success: true,
      message: "Connection successful! SMTP settings are valid.",
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to SMTP server";

    await emailLogger.error(`SMTP connection test failed: ${errorMessage}`, {
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
