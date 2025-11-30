import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find contact by email
    const contact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!contact) {
      return NextResponse.json({ success: true });
    }

    // Check if they signed up with Google (no password)
    if (!contact.passwordHash) {
      // Still return success but don't send email
      // In a real app, you might send an email saying "use Google to sign in"
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store token (you'd need to add these fields to Contact model)
    // For now, we'll just return success - in production you'd:
    // 1. Add resetToken and resetTokenExpiry to Contact model
    // 2. Store the hashed token
    // 3. Send email with reset link

    // TODO: Implement email sending with reset link
    // const resetUrl = `${process.env.NEXTAUTH_URL}/portal/reset-password?token=${resetToken}`;
    // await sendEmail(contact.email, "Password Reset", `Click here to reset: ${resetUrl}`);

    console.log(`Password reset requested for ${email}`);
    console.log(`Reset token (would be emailed): ${resetToken}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
