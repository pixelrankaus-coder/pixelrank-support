import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleCode,
  authenticateWithGoogle,
  setCustomerSession,
} from "@/lib/customer-auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL("/portal/login?error=google_auth_failed", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/portal/login?error=no_code", request.url)
    );
  }

  try {
    // Exchange code for user info
    const googleResult = await exchangeGoogleCode(code);

    if (!googleResult.success || !googleResult.email) {
      console.error("Google code exchange failed:", googleResult.error);
      return NextResponse.redirect(
        new URL("/portal/login?error=google_auth_failed", request.url)
      );
    }

    // Authenticate or create user
    const authResult = await authenticateWithGoogle(
      googleResult.email,
      googleResult.name,
      googleResult.googleId
    );

    if (!authResult.success || !authResult.session) {
      return NextResponse.redirect(
        new URL("/portal/login?error=auth_failed", request.url)
      );
    }

    // Set session
    await setCustomerSession(authResult.session);

    // Redirect to portal
    return NextResponse.redirect(new URL("/portal", request.url));
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/portal/login?error=google_auth_failed", request.url)
    );
  }
}
