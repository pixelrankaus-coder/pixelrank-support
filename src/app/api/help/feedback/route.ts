import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, isHelpful, comment } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    // Get IP address for tracking (to prevent duplicate feedback)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check if this IP already submitted feedback for this article
    const existingFeedback = await prisma.kBArticleFeedback.findFirst({
      where: {
        articleId,
        ipAddress: ip,
      },
    });

    if (existingFeedback) {
      return NextResponse.json({
        success: true,
        message: "Feedback already submitted",
      });
    }

    // Create feedback record
    await prisma.kBArticleFeedback.create({
      data: {
        articleId,
        isHelpful,
        comment,
        ipAddress: ip,
      },
    });

    // Update article counts
    if (isHelpful) {
      await prisma.kBArticle.update({
        where: { id: articleId },
        data: { helpfulCount: { increment: 1 } },
      });
    } else {
      await prisma.kBArticle.update({
        where: { id: articleId },
        data: { notHelpfulCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
