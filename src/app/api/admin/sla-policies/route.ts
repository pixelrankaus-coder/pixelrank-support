import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/sla-policies - List all SLA policies
export async function GET() {
  try {
    const policies = await prisma.sLAPolicy.findMany({
      include: {
        targets: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("Failed to fetch SLA policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch SLA policies" },
      { status: 500 }
    );
  }
}

// POST /api/admin/sla-policies - Create a new SLA policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, targets } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const policy = await prisma.sLAPolicy.create({
      data: {
        name,
        description,
        targets: {
          create: targets || [
            { priority: "URGENT", firstResponseTime: 60, resolutionTime: 240, operationalHours: "CALENDAR", escalationEnabled: true },
            { priority: "HIGH", firstResponseTime: 240, resolutionTime: 480, operationalHours: "BUSINESS", escalationEnabled: true },
            { priority: "MEDIUM", firstResponseTime: 480, resolutionTime: 2880, operationalHours: "BUSINESS", escalationEnabled: true },
            { priority: "LOW", firstResponseTime: 1440, resolutionTime: 7200, operationalHours: "BUSINESS", escalationEnabled: false },
          ],
        },
      },
      include: {
        targets: true,
      },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Failed to create SLA policy:", error);
    return NextResponse.json(
      { error: "Failed to create SLA policy" },
      { status: 500 }
    );
  }
}
