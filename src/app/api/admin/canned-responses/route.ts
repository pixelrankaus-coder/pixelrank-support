import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const responses = await prisma.cannedResponse.findMany({
    include: {
      folder: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(responses);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, content, folderId, visibility } = body;

    if (!title || !content || !folderId) {
      return NextResponse.json(
        { error: "Title, content, and folder are required" },
        { status: 400 }
      );
    }

    const response = await prisma.cannedResponse.create({
      data: {
        title,
        content,
        folderId,
        visibility: visibility || "ALL",
        ownerId: visibility === "MYSELF" ? session.user.id : null,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create canned response:", error);
    return NextResponse.json(
      { error: "Failed to create canned response" },
      { status: 500 }
    );
  }
}
