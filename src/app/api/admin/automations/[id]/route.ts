import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/automations/[id] - Get a single automation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Failed to fetch automation:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/automations/[id] - Update an automation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, trigger, conditions, actions } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const automation = await prisma.automation.update({
      where: { id },
      data: {
        name,
        description,
        trigger,
        conditions,
        actions,
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Failed to update automation:", error);
    return NextResponse.json(
      { error: "Failed to update automation" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/automations/[id] - Toggle automation active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const automation = await prisma.automation.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Failed to toggle automation:", error);
    return NextResponse.json(
      { error: "Failed to toggle automation" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/automations/[id] - Delete an automation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.automation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete automation:", error);
    return NextResponse.json(
      { error: "Failed to delete automation" },
      { status: 500 }
    );
  }
}
