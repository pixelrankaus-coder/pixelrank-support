import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/canned-responses - Get canned responses for the current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch canned responses visible to this user
    // ALL = visible to everyone
    // MYSELF = only visible to owner
    const responses = await prisma.cannedResponse.findMany({
      where: {
        OR: [
          { visibility: "ALL" },
          { visibility: "MYSELF", ownerId: session.user.id },
        ],
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { title: "asc" },
    });

    // Group responses by folder
    const folders = await prisma.cannedResponseFolder.findMany({
      orderBy: { name: "asc" },
    });

    const grouped = folders.map((folder) => ({
      ...folder,
      responses: responses.filter((r) => r.folderId === folder.id),
    })).filter((folder) => folder.responses.length > 0);

    return NextResponse.json({
      responses,
      folders: grouped,
    });
  } catch (error) {
    console.error("Failed to fetch canned responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch canned responses" },
      { status: 500 }
    );
  }
}
