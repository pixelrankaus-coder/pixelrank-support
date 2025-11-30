import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/email-channels - List all email channels
export async function GET() {
  try {
    const channels = await prisma.emailChannel.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error("Failed to fetch email channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch email channels" },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-channels - Create a new email channel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      imapHost,
      imapPort,
      imapUser,
      imapPassword,
      imapSecure,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.emailChannel.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An email channel with this address already exists" },
        { status: 400 }
      );
    }

    // Check if this should be the default (first channel)
    const count = await prisma.emailChannel.count();
    const isDefault = count === 0;

    const channel = await prisma.emailChannel.create({
      data: {
        name,
        email,
        isDefault,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort || null,
        smtpUser: smtpUser || null,
        smtpPassword: smtpPassword || null,
        smtpSecure: smtpSecure ?? true,
        imapHost: imapHost || null,
        imapPort: imapPort || null,
        imapUser: imapUser || null,
        imapPassword: imapPassword || null,
        imapSecure: imapSecure ?? true,
      },
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Failed to create email channel:", error);
    return NextResponse.json(
      { error: "Failed to create email channel" },
      { status: 500 }
    );
  }
}
