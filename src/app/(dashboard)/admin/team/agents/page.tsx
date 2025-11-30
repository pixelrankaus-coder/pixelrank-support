import { prisma } from "@/lib/db";
import { AgentsList } from "./agents-list";

async function getAgents() {
  const agents = await prisma.user.findMany({
    orderBy: [
      { isAiAgent: "desc" }, // AI agents first
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isAiAgent: true,
      jobTitle: true,
      createdAt: true,
      _count: {
        select: {
          ticketsAssigned: true,
          tasksCreated: true,
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
    isAiAgent: agent.isAiAgent,
    jobTitle: agent.jobTitle,
    createdAt: agent.createdAt,
    ticketCount: agent._count.ticketsAssigned,
    taskCount: agent._count.tasksCreated,
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
