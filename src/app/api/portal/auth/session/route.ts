import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
