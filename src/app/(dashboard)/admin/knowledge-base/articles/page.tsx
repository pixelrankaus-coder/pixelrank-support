import { prisma } from "@/lib/db";
import { ArticlesClient } from "./articles-client";

export default async function KnowledgeBaseArticlesPage() {
  const [articles, categories] = await Promise.all([
    prisma.kBArticle.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.kBCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <ArticlesClient initialArticles={articles} categories={categories} />
  );
}
