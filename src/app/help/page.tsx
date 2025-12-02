import Link from "next/link";
import { prisma } from "@/lib/db";
import { MagnifyingGlassIcon, FolderIcon } from "@heroicons/react/24/outline";

// Force dynamic rendering to prevent build-time database queries
export const dynamic = "force-dynamic";

export default async function HelpCenterPage() {
  const categories = await prisma.kBCategory.findMany({
    where: {
      isPublished: true,
      parentId: null, // Only top-level categories
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          articles: {
            where: { status: "PUBLISHED" },
          },
        },
      },
      children: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  // Get popular articles
  const popularArticles = await prisma.kBArticle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { viewCount: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
      category: {
        select: { name: true, slug: true },
      },
    },
  });

  return (
    <div>
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white -mt-[1px]">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-blue-100 mb-8">
            Search our knowledge base or browse categories below
          </p>
          <form action="/help/search" method="get" className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="q"
              placeholder="Search for articles..."
              className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:ring-4 focus:ring-blue-300 focus:outline-none"
            />
          </form>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Browse by Category
        </h2>

        {categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No articles yet
            </h3>
            <p className="text-gray-500">
              Check back soon for helpful articles and guides.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/help/categories/${category.slug}`}
                className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl shrink-0 group-hover:bg-blue-200 transition-colors">
                    {category.icon || (
                      <FolderIcon className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {category.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {category._count.articles} article
                      {category._count.articles !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Popular Articles */}
        {popularArticles.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Popular Articles
            </h2>
            <div className="bg-white rounded-lg border divide-y">
              {popularArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/help/articles/${article.slug}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 hover:text-blue-600">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      in {article.category.name}
                    </p>
                  </div>
                  <span className="text-gray-400">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
