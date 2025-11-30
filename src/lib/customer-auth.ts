import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const secretKey = process.env.AUTH_SECRET || "customer-portal-secret-key";
const key = new TextEncoder().encode(secretKey);

export interface CustomerSession {
  id: string;
  email: string;
  name: string | null;
  [key: string]: unknown;
}

export async function encryptCustomerSession(
  payload: CustomerSession
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decryptCustomerSession(
  token: string
): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as CustomerSession;
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_session")?.value;
  if (!token) return null;
  return decryptCustomerSession(token);
}

export async function setCustomerSession(session: CustomerSession) {
  const token = await encryptCustomerSession(session);
  const cookieStore = await cookies();
  cookieStore.set("customer_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete("customer_session");
}

export async function registerCustomer(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ success: boolean; error?: string; contact?: { id: string } }> {
  try {
    // Check if contact already exists with a password
    const existingContact = await prisma.contact.findUnique({
      where: { email: data.email },
    });

    if (existingContact?.passwordHash) {
      return { success: false, error: "An account with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    if (existingContact) {
      // Update existing contact with password
      const contact = await prisma.contact.update({
        where: { id: existingContact.id },
        data: {
          passwordHash,
          name: data.name || existingContact.name,
          isVerified: true, // For now, auto-verify
        },
      });
      return { success: true, contact: { id: contact.id } };
    } else {
      // Create new contact
      const contact = await prisma.contact.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          isVerified: true, // For now, auto-verify
        },
      });
      return { success: true, contact: { id: contact.id } };
    }
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Registration failed" };
  }
}

export async function authenticateCustomer(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; session?: CustomerSession }> {
  try {
    const contact = await prisma.contact.findUnique({
      where: { email },
    });

    if (!contact || !contact.passwordHash) {
      return { success: false, error: "Invalid email or password" };
    }

    const passwordMatch = await bcrypt.compare(password, contact.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password" };
    }

    const session: CustomerSession = {
      id: contact.id,
      email: contact.email,
      name: contact.name,
    };

    return { success: true, session };
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

// Google OAuth functions
export function getGoogleAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/portal/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<{
  success: boolean;
  error?: string;
  email?: string;
  name?: string;
  googleId?: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/portal/auth/google/callback`;

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData);
      return { success: false, error: "Failed to authenticate with Google" };
    }

    // Get user info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      return { success: false, error: "Failed to get user info from Google" };
    }

    return {
      success: true,
      email: userData.email,
      name: userData.name,
      googleId: userData.id,
    };
  } catch (error) {
    console.error("Google OAuth error:", error);
    return { success: false, error: "Google authentication failed" };
  }
}

export async function authenticateWithGoogle(
  email: string,
  name?: string,
  googleId?: string
): Promise<{ success: boolean; error?: string; session?: CustomerSession }> {
  try {
    // Find or create contact
    let contact = await prisma.contact.findUnique({
      where: { email },
    });

    if (!contact) {
      // Create new contact
      contact = await prisma.contact.create({
        data: {
          email,
          name: name || null,
          isVerified: true, // Google accounts are pre-verified
        },
      });
    } else if (!contact.name && name) {
      // Update name if not set
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: { name, isVerified: true },
      });
    }

    const session: CustomerSession = {
      id: contact.id,
      email: contact.email,
      name: contact.name,
    };

    return { success: true, session };
  } catch (error) {
    console.error("Google authentication error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
