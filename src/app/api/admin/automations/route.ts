import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/automations - List all automations
export async function GET() {
  try {
    const automations = await prisma.automation.findMany({
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Failed to fetch automations:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

// POST /api/admin/automations - Create a new automation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, trigger, conditions, actions } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!actions || JSON.parse(actions).length === 0) {
      return NextResponse.json(
        { error: "At least one action is required" },
        { status: 400 }
      );
    }

    // Get the max priority to add new automation at the end
    const maxPriority = await prisma.automation.aggregate({
      _max: { priority: true },
    });

    const automation = await prisma.automation.create({
      data: {
        name,
        description,
        trigger: trigger || "TICKET_CREATED",
        conditions: conditions || "[]",
        actions: actions || "[]",
        priority: (maxPriority._max.priority || 0) + 1,
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Failed to create automation:", error);
    return NextResponse.json(
      { error: "Failed to create automation" },
      { status: 500 }
    );
  }
}
