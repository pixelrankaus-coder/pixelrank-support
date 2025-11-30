import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { AgentEditClient } from "./agent-edit-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [agent, groups] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            group: true,
          },
        },
        badges: true,
        _count: {
          select: {
            ticketsAssigned: {
              where: {
                status: { in: ["OPEN", "PENDING"] },
              },
            },
          },
        },
      },
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  if (!agent) {
    notFound();
  }

  return (
    <AgentEditClient
      agent={{
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        phone: agent.phone,
        mobile: agent.mobile,
        jobTitle: agent.jobTitle,
        timezone: agent.timezone,
        signature: agent.signature,
        avatar: agent.avatar,
        agentType: agent.agentType,
        ticketScope: agent.ticketScope,
        level: agent.level,
        points: agent.points,
        channels: agent.channels,
        createdAt: agent.createdAt,
        groupIds: agent.groups.map((g) => g.groupId),
        openTicketCount: agent._count.ticketsAssigned,
        badges: agent.badges.map((b) => b.badgeName),
      }}
      availableGroups={groups}
    />
  );
}
