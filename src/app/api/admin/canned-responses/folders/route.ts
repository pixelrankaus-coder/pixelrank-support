import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folders = await prisma.cannedResponseFolder.findMany({
    include: {
      _count: {
        select: { responses: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(folders);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const folder = await prisma.cannedResponseFolder.create({
      data: {
        name,
        type: type || "GENERAL",
        ownerId: type === "PERSONAL" ? session.user.id : null,
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
