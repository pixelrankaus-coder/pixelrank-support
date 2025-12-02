import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/top-banner - Public endpoint to get banner for display
export async function GET() {
  try {
    const banner = await prisma.topBanner.findUnique({
      where: { id: "default" },
    });

    // Return null if no banner or disabled
    if (!banner || !banner.isEnabled) {
      return NextResponse.json(null);
    }

    // Return only the fields needed for display
    return NextResponse.json({
      message: banner.message,
      linkText: banner.linkText,
      linkUrl: banner.linkUrl,
      backgroundColor: banner.backgroundColor,
      textColor: banner.textColor,
      dismissible: banner.dismissible,
    });
  } catch (error) {
    console.error("Failed to fetch top banner:", error);
    return NextResponse.json(null);
  }
}
