import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/admin/knowledge-base/articles
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const articles = await prisma.kBArticle.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST /api/admin/knowledge-base/articles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      categoryId,
      status,
      metaTitle,
      metaDescription,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(title);
    const existingSlug = await prisma.kBArticle.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Get max sort order for this category
    const maxOrder = await prisma.kBArticle.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    });

    const article = await prisma.kBArticle.create({
      data: {
        title,
        slug,
        content: content || "",
        excerpt,
        categoryId,
        status: status || "DRAFT",
        metaTitle,
        metaDescription,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Failed to create article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
