import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/knowledge-base/articles/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await prisma.kBArticle.findUnique({
      where: { id },
      include: {
        category: true,
        feedback: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Failed to fetch article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/knowledge-base/articles/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      categoryId,
      status,
      sortOrder,
      metaTitle,
      metaDescription,
    } = body;

    // Get current article to check status change
    const currentArticle = await prisma.kBArticle.findUnique({
      where: { id },
      select: { status: true, publishedAt: true },
    });

    // Set publishedAt when first published
    let publishedAt = currentArticle?.publishedAt;
    if (status === "PUBLISHED" && currentArticle?.status !== "PUBLISHED") {
      publishedAt = new Date();
    }

    const article = await prisma.kBArticle.update({
      where: { id },
      data: {
        title,
        content,
        excerpt,
        categoryId,
        status,
        sortOrder,
        metaTitle,
        metaDescription,
        publishedAt,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Failed to update article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/knowledge-base/articles/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.kBArticle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
