import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchAllEmails, fetchEmailsFromChannelById } from "@/lib/email-fetcher";

// POST /api/admin/email-channels/fetch - Fetch emails from all or specific channel
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { channelId } = body;

    let result;
    if (channelId) {
      result = await fetchEmailsFromChannelById(channelId);
    } else {
      result = await fetchAllEmails();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Email fetch failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch emails",
        newTickets: 0,
        newMessages: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 500 }
    );
  }
}
