import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/customer-auth";

export async function POST() {
  try {
    await clearCustomerSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
