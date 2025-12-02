import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/admin/top-banner - Get current banner settings
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let banner = await prisma.topBanner.findUnique({
      where: { id: "default" },
    });

    // Create default settings if not exists
    if (!banner) {
      banner = await prisma.topBanner.create({
        data: {
          id: "default",
          isEnabled: false,
          message: "Welcome to PixelRank Support!",
          linkText: "Learn More",
          linkUrl: "/updates",
          backgroundColor: "#EFF6FF",
          textColor: "#344054",
          dismissible: true,
        },
      });
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Failed to fetch top banner settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch top banner settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/top-banner - Update banner settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      isEnabled,
      message,
      linkText,
      linkUrl,
      backgroundColor,
      textColor,
      dismissible,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (typeof isEnabled === "boolean") {
      updateData.isEnabled = isEnabled;
    }
    if (message !== undefined) {
      updateData.message = message;
    }
    if (linkText !== undefined) {
      updateData.linkText = linkText || null;
    }
    if (linkUrl !== undefined) {
      updateData.linkUrl = linkUrl || null;
    }
    if (backgroundColor !== undefined) {
      updateData.backgroundColor = backgroundColor;
    }
    if (textColor !== undefined) {
      updateData.textColor = textColor;
    }
    if (typeof dismissible === "boolean") {
      updateData.dismissible = dismissible;
    }

    // Upsert banner settings
    const banner = await prisma.topBanner.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        isEnabled: isEnabled ?? false,
        message: message || "Welcome to PixelRank Support!",
        linkText: linkText || null,
        linkUrl: linkUrl || null,
        backgroundColor: backgroundColor || "#EFF6FF",
        textColor: textColor || "#344054",
        dismissible: dismissible ?? true,
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Failed to update top banner settings:", error);
    return NextResponse.json(
      { error: "Failed to update top banner settings" },
      { status: 500 }
    );
  }
}
