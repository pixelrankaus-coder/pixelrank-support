import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Platform configuration
const PLATFORMS = [
  { key: "blazeFacebook", label: "Facebook" },
  { key: "blazeInstagram", label: "Instagram" },
  { key: "blazeGoogle", label: "Google Business Profile" },
  { key: "blazeLinkedIn", label: "LinkedIn" },
  { key: "blazeTikTok", label: "TikTok" },
  { key: "blazeWordPress", label: "WordPress" },
  { key: "blazeMailchimp", label: "Mailchimp" },
  { key: "blazeN8n", label: "n8n" },
  { key: "blazeZapier", label: "Zapier" },
] as const;

type PlatformKey = typeof PLATFORMS[number]["key"];

// POST /api/blaze/setup-task - Create setup task with subtasks
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Get company details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Build subtasks list
    const subtasks: { title: string; sortOrder: number }[] = [
      { title: `Create Blaze workspace for ${company.name}`, sortOrder: 0 },
    ];

    // Add subtask for each platform not yet connected
    let sortOrder = 1;
    for (const platform of PLATFORMS) {
      if (!company[platform.key as PlatformKey]) {
        subtasks.push({
          title: `Connect ${platform.label}`,
          sortOrder: sortOrder++,
        });
      }
    }

    // Create task with subtasks
    const task = await prisma.task.create({
      data: {
        title: `Set up ${company.name} on Blaze.ai`,
        description: `Set up Blaze workspace and connect social media accounts for ${company.name}`,
        status: "TODO",
        priority: "MEDIUM",
        createdById: session.user.id,
        companyId: company.id,
        // Create subtasks
        subtasks: {
          create: subtasks,
        },
      },
      include: {
        subtasks: true,
        company: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create setup task:", error);
    return NextResponse.json(
      { error: "Failed to create setup task" },
      { status: 500 }
    );
  }
}
