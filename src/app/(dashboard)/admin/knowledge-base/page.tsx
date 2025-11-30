import { prisma } from "@/lib/db";
import { CategoriesClient } from "./categories-client";

export default async function KnowledgeBaseCategoriesPage() {
  const categories = await prisma.kBCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { articles: true },
      },
      parent: {
        select: { id: true, name: true },
      },
    },
  });

  return <CategoriesClient initialCategories={categories} />;
}
