import { prisma } from "@/lib/db";
import { AutomationsClient } from "./automations-client";

export default async function AutomationsPage() {
  const [automations, agents, groups] = await Promise.all([
    prisma.automation.findMany({
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <AutomationsClient automations={automations} agents={agents} groups={groups} />;
}
