import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Get contact with password
    const contact = await prisma.contact.findUnique({
      where: { id: session.id },
      select: { id: true, passwordHash: true },
    });

    if (!contact) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user registered via Google OAuth, they may not have a password
    if (!contact.passwordHash) {
      return NextResponse.json(
        { error: "Cannot change password for accounts created via Google sign-in. Please use Google to access your account." },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, contact.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.contact.update({
      where: { id: session.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to change password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
