import { NextRequest, NextResponse } from "next/server";
import {
  registerCustomer,
  setCustomerSession,
} from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const result = await registerCustomer({ email, password, name });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Auto-login after registration
    await setCustomerSession({
      id: result.contact!.id,
      email,
      name: name || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
