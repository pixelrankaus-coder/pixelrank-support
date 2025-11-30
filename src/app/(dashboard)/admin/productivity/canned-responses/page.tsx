import { prisma } from "@/lib/db";
import { CannedResponsesClient } from "./canned-responses-client";

async function getFoldersWithResponses() {
  const folders = await prisma.cannedResponseFolder.findMany({
    include: {
      responses: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { responses: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return folders;
}

export default async function CannedResponsesPage() {
  const folders = await getFoldersWithResponses();

  // If no folders exist, create default ones
  if (folders.length === 0) {
    await prisma.cannedResponseFolder.createMany({
      data: [
        { name: "Personal", type: "PERSONAL" },
        { name: "General", type: "GENERAL" },
      ],
    });

    const newFolders = await getFoldersWithResponses();
    return <CannedResponsesClient initialFolders={newFolders} />;
  }

  return <CannedResponsesClient initialFolders={folders} />;
}
