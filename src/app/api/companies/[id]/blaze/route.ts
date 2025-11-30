import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Helper to log activity
async function logActivity(
  companyId: string,
  eventType: string,
  message: string,
  status: "INFO" | "SUCCESS" | "WARNING" | "ERROR",
  details?: object
) {
  try {
    await prisma.blazeActivityLog.create({
      data: {
        companyId,
        eventType,
        message,
        status,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

// PATCH /api/companies/[id]/blaze - Update Blaze settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      isOnBlaze,
      blazeApiKey,
      blazeWorkspaceId,
      blazeStartDate,
      blazeFacebook,
      blazeInstagram,
      blazeGoogle,
      blazeLinkedIn,
      blazeTikTok,
      blazeWordPress,
      blazeMailchimp,
      blazeN8n,
      blazeZapier,
    } = body;

    // Build update data - only include fields that were provided
    const updateData: Record<string, unknown> = {};
    if (isOnBlaze !== undefined) updateData.isOnBlaze = isOnBlaze;
    if (blazeApiKey !== undefined) updateData.blazeApiKey = blazeApiKey;
    if (blazeWorkspaceId !== undefined) updateData.blazeWorkspaceId = blazeWorkspaceId;
    if (blazeStartDate !== undefined) updateData.blazeStartDate = blazeStartDate ? new Date(blazeStartDate) : null;
    if (blazeFacebook !== undefined) updateData.blazeFacebook = blazeFacebook;
    if (blazeInstagram !== undefined) updateData.blazeInstagram = blazeInstagram;
    if (blazeGoogle !== undefined) updateData.blazeGoogle = blazeGoogle;
    if (blazeLinkedIn !== undefined) updateData.blazeLinkedIn = blazeLinkedIn;
    if (blazeTikTok !== undefined) updateData.blazeTikTok = blazeTikTok;
    if (blazeWordPress !== undefined) updateData.blazeWordPress = blazeWordPress;
    if (blazeMailchimp !== undefined) updateData.blazeMailchimp = blazeMailchimp;
    if (blazeN8n !== undefined) updateData.blazeN8n = blazeN8n;
    if (blazeZapier !== undefined) updateData.blazeZapier = blazeZapier;

    // Update last sync timestamp when API key is set
    if (blazeApiKey) {
      updateData.blazeLastSync = new Date();
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    // Log activity based on what was updated
    if (blazeApiKey !== undefined) {
      if (blazeApiKey) {
        await logActivity(id, "API_SAVED", "API key saved successfully", "SUCCESS");
      } else {
        await logActivity(id, "API_REMOVED", "API key removed", "INFO");
      }
    }

    // Log channel changes
    const channels = [
      { key: "blazeFacebook", name: "Facebook" },
      { key: "blazeInstagram", name: "Instagram" },
      { key: "blazeGoogle", name: "Google" },
      { key: "blazeLinkedIn", name: "LinkedIn" },
      { key: "blazeTikTok", name: "TikTok" },
      { key: "blazeWordPress", name: "WordPress" },
      { key: "blazeMailchimp", name: "Mailchimp" },
      { key: "blazeN8n", name: "n8n" },
      { key: "blazeZapier", name: "Zapier" },
    ];

    for (const channel of channels) {
      const value = body[channel.key];
      if (value !== undefined) {
        await logActivity(
          id,
          value ? "CHANNEL_CONNECTED" : "CHANNEL_DISCONNECTED",
          `${channel.name} ${value ? "connected" : "disconnected"}`,
          value ? "SUCCESS" : "INFO"
        );
      }
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Failed to update Blaze settings:", error);
    return NextResponse.json(
      { error: "Failed to update Blaze settings" },
      { status: 500 }
    );
  }
}
