import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/admin/email-templates/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subject, body: templateBody, isActive } = body;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        subject,
        body: templateBody,
        isActive,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to update email template:", error);
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 }
    );
  }
}
