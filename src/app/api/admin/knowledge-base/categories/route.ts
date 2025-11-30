import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/admin/knowledge-base/categories
export async function GET() {
  try {
    const categories = await prisma.kBCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: { articles: true },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/admin/knowledge-base/categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, parentId, isPublished } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate unique slug
    let slug = generateSlug(name);
    const existingSlug = await prisma.kBCategory.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Get max sort order
    const maxOrder = await prisma.kBCategory.aggregate({
      _max: { sortOrder: true },
    });

    const category = await prisma.kBCategory.create({
      data: {
        name,
        slug,
        description,
        icon,
        parentId: parentId || null,
        isPublished: isPublished ?? true,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
