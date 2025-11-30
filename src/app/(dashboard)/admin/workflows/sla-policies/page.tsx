import { prisma } from "@/lib/db";
import { SLAPoliciesClient } from "./sla-policies-client";

async function getSLAPolicies() {
  const policies = await prisma.sLAPolicy.findMany({
    include: {
      targets: {
        orderBy: {
          priority: "asc",
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return policies;
}

async function ensureDefaultPolicy() {
  const existingDefault = await prisma.sLAPolicy.findFirst({
    where: { isDefault: true },
  });

  if (!existingDefault) {
    // Create default SLA policy with targets
    await prisma.sLAPolicy.create({
      data: {
        name: "Default SLA Policy",
        description: "default policy",
        isDefault: true,
        isActive: true,
        targets: {
          create: [
            {
              priority: "URGENT",
              firstResponseTime: 60, // 1 hour
              resolutionTime: 7200, // 5 days
              operationalHours: "BUSINESS",
              escalationEnabled: true,
            },
            {
              priority: "HIGH",
              firstResponseTime: 240, // 4 hours
              resolutionTime: 7200, // 5 days
              operationalHours: "BUSINESS",
              escalationEnabled: true,
            },
            {
              priority: "MEDIUM",
              firstResponseTime: 480, // 8 hours
              resolutionTime: 7200, // 5 days
              operationalHours: "BUSINESS",
              escalationEnabled: true,
            },
            {
              priority: "LOW",
              firstResponseTime: 1440, // 1 day
              resolutionTime: 7200, // 5 days
              operationalHours: "BUSINESS",
              escalationEnabled: true,
            },
          ],
        },
      },
    });
  }
}

export default async function SLAPoliciesPage() {
  await ensureDefaultPolicy();
  const policies = await getSLAPolicies();

  return <SLAPoliciesClient policies={policies} />;
}
