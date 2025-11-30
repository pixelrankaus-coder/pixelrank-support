import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contact = await prisma.contact.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        workPhone: true,
        company: true,
        createdAt: true,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, workPhone, company } = await request.json();

    const contact = await prisma.contact.update({
      where: { id: session.id },
      data: {
        name: name || null,
        workPhone: workPhone || null,
        company: company || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        workPhone: true,
        company: true,
        createdAt: true,
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
