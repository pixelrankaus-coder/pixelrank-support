import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        website: true,
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Failed to get companies:", error);
    return NextResponse.json(
      { error: "Failed to get companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, website } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        website: website?.trim() || null,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Failed to create company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
