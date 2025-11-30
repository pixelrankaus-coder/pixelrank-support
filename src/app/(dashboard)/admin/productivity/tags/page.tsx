import { prisma } from "@/lib/db";
import { TagsClient } from "./tags-client";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          tickets: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return <TagsClient tags={tags} />;
}
