import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/customer-auth";

export async function GET() {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 }
    );
  }

  const authUrl = getGoogleAuthUrl();
  return NextResponse.redirect(authUrl);
}
