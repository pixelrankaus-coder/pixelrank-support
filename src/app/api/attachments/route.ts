import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadAttachment, getTicketAttachments, deleteAttachment } from "@/lib/storage";

// POST /api/attachments - Upload a file
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const ticketId = formData.get("ticketId") as string | null;
    const messageId = formData.get("messageId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await uploadAttachment(file, {
      ticketId: ticketId || undefined,
      messageId: messageId || undefined,
      uploadedById: session.user.id,
      uploadedByType: "AGENT",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.attachment);
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

// GET /api/attachments?ticketId=xxx - Get attachments for a ticket
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required" },
        { status: 400 }
      );
    }

    const attachments = await getTicketAttachments(ticketId);
    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Failed to get attachments:", error);
    return NextResponse.json(
      { error: "Failed to get attachments" },
      { status: 500 }
    );
  }
}

// DELETE /api/attachments?id=xxx - Delete an attachment
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const success = await deleteAttachment(id);
    if (!success) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
