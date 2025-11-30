import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  FolderIcon,
  DocumentTextIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.kBCategory.findUnique({
    where: { slug },
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      children: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: {
              articles: {
                where: { status: "PUBLISHED" },
              },
            },
          },
        },
      },
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          viewCount: true,
        },
      },
    },
  });

  if (!category || !category.isPublished) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/help" className="hover:text-gray-700">
          Help Center
        </Link>
        <ChevronRightIcon className="w-4 h-4" />
        {category.parent && (
          <>
            <Link
              href={`/help/categories/${category.parent.slug}`}
              className="hover:text-gray-700"
            >
              {category.parent.name}
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
          </>
        )}
        <span className="text-gray-900">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-3xl">
          {category.icon || <FolderIcon className="w-8 h-8 text-blue-600" />}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="text-gray-500 mt-1">{category.description}</p>
          )}
        </div>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Subcategories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/help/categories/${child.slug}`}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                  {child.icon || (
                    <FolderIcon className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{child.name}</h3>
                  <p className="text-sm text-gray-500">
                    {child._count.articles} article
                    {child._count.articles !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Articles in this category
        </h2>
        {category.articles.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No articles in this category yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border divide-y">
            {category.articles.map((article) => (
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
        )}
      </div>
    </div>
  );
}
