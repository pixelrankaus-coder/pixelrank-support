import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { ArticleFeedback } from "./article-feedback";

// Force dynamic rendering to prevent build-time database queries
export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await prisma.kBArticle.findUnique({
    where: { slug },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  // Increment view count (fire and forget)
  prisma.kBArticle
    .update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  // Get related articles in the same category
  const relatedArticles = await prisma.kBArticle.findMany({
    where: {
      categoryId: article.categoryId,
      status: "PUBLISHED",
      id: { not: article.id },
    },
    orderBy: { viewCount: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/help" className="hover:text-gray-700">
          Help Center
        </Link>
        <ChevronRightIcon className="w-4 h-4" />
        <Link
          href={`/help/categories/${article.category.slug}`}
          className="hover:text-gray-700"
        >
          {article.category.name}
        </Link>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-gray-900 truncate max-w-xs">{article.title}</span>
      </nav>

      {/* Article Content */}
      <article className="bg-white rounded-lg border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-lg text-gray-600 mb-8 pb-6 border-b">
            {article.excerpt}
          </p>
        )}

        {/* Article Body */}
        <div
          className="prose prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Feedback Section */}
        <div className="mt-12 pt-8 border-t">
          <ArticleFeedback articleId={article.id} />
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Related Articles
          </h2>
          <div className="bg-white rounded-lg border divide-y">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/help/articles/${related.slug}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-900 hover:text-blue-600">
                  {related.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back to Category */}
      <div className="mt-8 text-center">
        <Link
          href={`/help/categories/${article.category.slug}`}
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to {article.category.name}
        </Link>
      </div>
    </div>
  );
}
