import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/email-templates - List all email templates
export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}
