import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, visibility, folderId } = body;

    const response = await prisma.cannedResponse.update({
      where: { id },
      data: {
        title,
        content,
        visibility,
        folderId,
        ownerId: visibility === "MYSELF" ? session.user.id : null,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update canned response:", error);
    return NextResponse.json(
      { error: "Failed to update canned response" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.cannedResponse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete canned response:", error);
    return NextResponse.json(
      { error: "Failed to delete canned response" },
      { status: 500 }
    );
  }
}
