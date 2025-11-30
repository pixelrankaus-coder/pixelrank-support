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
    const { name, email, title, company, companyId, workPhone, facebook, twitter } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if email is already used by another contact
    const existingContact = await prisma.contact.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existingContact) {
      return NextResponse.json(
        { error: "Email is already in use by another contact" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: name || null,
        email,
        title: title || null,
        company: company || null,
        companyId: companyId || null,
        workPhone: workPhone || null,
        facebook: facebook || null,
        twitter: twitter || null,
      },
    });

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error("Failed to update contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}
