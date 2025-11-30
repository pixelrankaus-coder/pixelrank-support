import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query } = await searchParams;

  let articles: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    category: { name: string; slug: string };
  }[] = [];

  if (query && query.trim().length > 0) {
    const searchTerm = query.trim().toLowerCase();

    articles = await prisma.kBArticle.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: searchTerm } },
          { excerpt: { contains: searchTerm } },
          { content: { contains: searchTerm } },
        ],
      },
      orderBy: [{ viewCount: "desc" }, { title: "asc" }],
      take: 50,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: {
          select: { name: true, slug: true },
        },
      },
    });
  }

  return (
    <div>
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white -mt-[1px]">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-6">Search Results</h1>
          <form action="/help/search" method="get" className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search for articles..."
              className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:ring-4 focus:ring-blue-300 focus:outline-none"
            />
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!query || query.trim().length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Enter a search term
            </h2>
            <p className="text-gray-500">
              Type something in the search box above to find articles.
            </p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h2>
            <p className="text-gray-500 mb-4">
              We couldn&apos;t find any articles matching &quot;{query}&quot;
            </p>
            <p className="text-sm text-gray-400">
              Try different keywords or{" "}
              <Link href="/help" className="text-blue-600 hover:underline">
                browse categories
              </Link>
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-6">
              Found {articles.length} result{articles.length !== 1 ? "s" : ""}{" "}
              for &quot;{query}&quot;
            </p>
            <div className="bg-white rounded-lg border divide-y">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/help/articles/${article.slug}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900 hover:text-blue-600">
                        {article.title}
                      </h3>
                      <p className="text-sm text-blue-600 mt-0.5">
                        {article.category.name}
                      </p>
                      {article.excerpt && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Help Center */}
        <div className="mt-8 text-center">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">
            &larr; Back to Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
