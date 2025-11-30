import { prisma } from "@/lib/db";
import { AgentsList } from "./agents-list";

async function getAgents() {
  const agents = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          ticketsAssigned: true,
        },
      },
    },
  });

  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    role: agent.role,
    avatar: agent.avatar,
    createdAt: agent.createdAt,
    ticketCount: agent._count.ticketsAssigned,
  }));
}

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Agents</h3>
          <p className="text-sm text-gray-500">
            Manage your support team members and their access levels
          </p>
        </div>
      </div>

      <AgentsList initialAgents={agents} />
    </div>
  );
}
