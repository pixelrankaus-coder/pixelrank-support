import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";

// POST /api/admin/email-channels/[id]/test - Test email channel connection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const channel = await prisma.emailChannel.findUnique({
      where: { id },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Email channel not found" },
        { status: 404 }
      );
    }

    if (!channel.smtpHost || !channel.smtpPort) {
      return NextResponse.json(
        { error: "SMTP settings are not configured", message: "SMTP settings are not configured" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: "Connection successful! SMTP settings are valid.",
    });
  } catch (error) {
    console.error("Failed to test email channel:", error);
    return NextResponse.json(
      {
        error: "Connection failed",
        message: error instanceof Error ? error.message : "Failed to connect to SMTP server",
      },
      { status: 500 }
    );
  }
}
