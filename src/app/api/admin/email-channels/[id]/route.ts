import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/email-channels/[id]
export async function GET(
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

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Failed to fetch email channel:", error);
    return NextResponse.json(
      { error: "Failed to fetch email channel" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email-channels/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      isActive,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {
      name,
      email,
      smtpHost: smtpHost || null,
      smtpPort: smtpPort || null,
      smtpUser: smtpUser || null,
      smtpSecure: smtpSecure ?? true,
      imapHost: imapHost || null,
      imapPort: imapPort || null,
      imapUser: imapUser || null,
      imapSecure: imapSecure ?? true,
    };

    // Only update passwords if provided
    if (smtpPassword) {
      updateData.smtpPassword = smtpPassword;
    }

    if (imapPassword) {
      updateData.imapPassword = imapPassword;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    const channel = await prisma.emailChannel.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Failed to update email channel:", error);
    return NextResponse.json(
      { error: "Failed to update email channel" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email-channels/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.emailChannel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete email channel:", error);
    return NextResponse.json(
      { error: "Failed to delete email channel" },
      { status: 500 }
    );
  }
}
