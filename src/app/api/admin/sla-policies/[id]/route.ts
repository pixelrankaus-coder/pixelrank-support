import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/sla-policies/[id] - Get a single SLA policy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const policy = await prisma.sLAPolicy.findUnique({
      where: { id },
      include: {
        targets: true,
      },
    });

    if (!policy) {
      return NextResponse.json(
        { error: "SLA policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Failed to fetch SLA policy:", error);
    return NextResponse.json(
      { error: "Failed to fetch SLA policy" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/sla-policies/[id] - Update an SLA policy
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, targets } = body;

    // Update the policy
    const policy = await prisma.sLAPolicy.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    // Update targets if provided
    if (targets && Array.isArray(targets)) {
      for (const target of targets) {
        await prisma.sLATarget.upsert({
          where: {
            policyId_priority: {
              policyId: id,
              priority: target.priority,
            },
          },
          update: {
            firstResponseTime: target.firstResponseTime,
            resolutionTime: target.resolutionTime,
            operationalHours: target.operationalHours,
            escalationEnabled: target.escalationEnabled,
          },
          create: {
            policyId: id,
            priority: target.priority,
            firstResponseTime: target.firstResponseTime,
            resolutionTime: target.resolutionTime,
            operationalHours: target.operationalHours,
            escalationEnabled: target.escalationEnabled,
          },
        });
      }
    }

    // Fetch updated policy with targets
    const updatedPolicy = await prisma.sLAPolicy.findUnique({
      where: { id },
      include: {
        targets: true,
      },
    });

    return NextResponse.json(updatedPolicy);
  } catch (error) {
    console.error("Failed to update SLA policy:", error);
    return NextResponse.json(
      { error: "Failed to update SLA policy" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/sla-policies/[id] - Toggle SLA policy active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const policy = await prisma.sLAPolicy.update({
      where: { id },
      data: { isActive },
      include: {
        targets: true,
      },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Failed to toggle SLA policy:", error);
    return NextResponse.json(
      { error: "Failed to toggle SLA policy" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/sla-policies/[id] - Delete an SLA policy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if this is the default policy
    const policy = await prisma.sLAPolicy.findUnique({
      where: { id },
    });

    if (policy?.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default SLA policy" },
        { status: 400 }
      );
    }

    // Delete targets first
    await prisma.sLATarget.deleteMany({
      where: { policyId: id },
    });

    // Delete the policy
    await prisma.sLAPolicy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete SLA policy:", error);
    return NextResponse.json(
      { error: "Failed to delete SLA policy" },
      { status: 500 }
    );
  }
}
