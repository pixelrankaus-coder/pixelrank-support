import { NextRequest, NextResponse } from "next/server";
import {
  authenticateCustomer,
  setCustomerSession,
} from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await authenticateCustomer(email, password);

    if (!result.success || !result.session) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await setCustomerSession(result.session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
