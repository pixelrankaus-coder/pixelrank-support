import { prisma } from "@/lib/db";
import { ArticlesClient } from "./articles-client";

export default async function KnowledgeBaseArticlesPage() {
  const [articlesRaw, categories] = await Promise.all([
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

  // Serialize dates to strings for client component
  const articles = articlesRaw.map((article) => ({
    ...article,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    publishedAt: article.publishedAt?.toISOString() || null,
  }));

  return (
    <ArticlesClient initialArticles={articles} categories={categories} />
  );
}
