import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/knowledge-base/categories/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.kBCategory.findUnique({
      where: { id },
      include: {
        articles: {
          orderBy: { sortOrder: "asc" },
        },
        parent: true,
        children: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/knowledge-base/categories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, icon, parentId, isPublished, sortOrder } = body;

    const category = await prisma.kBCategory.update({
      where: { id },
      data: {
        name,
        description,
        icon,
        parentId: parentId || null,
        isPublished,
        sortOrder,
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/knowledge-base/categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if category has articles
    const articleCount = await prisma.kBArticle.count({
      where: { categoryId: id },
    });

    if (articleCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with articles. Move or delete articles first." },
        { status: 400 }
      );
    }

    // Check if category has children
    const childCount = await prisma.kBCategory.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories. Delete subcategories first." },
        { status: 400 }
      );
    }

    await prisma.kBCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
