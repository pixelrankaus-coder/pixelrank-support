import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, website } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Check if company exists
    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Update the company
    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: name.trim(),
        website: website?.trim() || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}
