import { prisma } from "@/lib/db";
import { GroupsClient } from "./groups-client";

export default async function GroupsPage() {
  const [groups, agents] = await Promise.all([
    prisma.group.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return <GroupsClient groups={groups} agents={agents} />;
}
