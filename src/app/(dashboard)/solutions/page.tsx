import Link from "next/link";
import { prisma } from "@/lib/db";
import { getRecentChanges } from "@/lib/changelog-parser";
import {
  BookOpenIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default async function SolutionsPage() {
  const recentChanges = getRecentChanges(3);

  const [categories, recentArticles, stats] = await Promise.all([
    prisma.kBCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    }),
    prisma.kBArticle.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        category: {
          select: { name: true },
        },
      },
    }),
    prisma.kBArticle.aggregate({
      _sum: {
        viewCount: true,
        helpfulCount: true,
        notHelpfulCount: true,
      },
      _count: true,
    }),
  ]);

  const totalViews = stats._sum.viewCount || 0;
  const totalHelpful = stats._sum.helpfulCount || 0;
  const totalNotHelpful = stats._sum.notHelpfulCount || 0;
  const totalArticles = stats._count;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solutions</h1>
          <p className="text-gray-500 mt-1">
            Manage your knowledge base articles and categories
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/help"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            View Help Center
          </Link>
          <Link
            href="/admin/knowledge-base"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PencilIcon className="w-4 h-4" />
            Manage Knowledge Base
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{totalArticles}</div>
          <div className="text-sm text-gray-500">Total Articles</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
          <div className="text-sm text-gray-500">Categories</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{totalViews}</div>
          <div className="text-sm text-gray-500">Total Views</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">
            {totalHelpful + totalNotHelpful > 0
              ? Math.round((totalHelpful / (totalHelpful + totalNotHelpful)) * 100)
              : 0}
            %
          </div>
          <div className="text-sm text-gray-500">Helpful Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Categories</h2>
            <Link
              href="/admin/knowledge-base"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Manage
            </Link>
          </div>
          {categories.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpenIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No categories yet</p>
              <Link
                href="/admin/knowledge-base"
                className="text-blue-600 text-sm hover:underline"
              >
                Create your first category
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      {category.icon || (
                        <BookOpenIcon className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {category._count.articles} articles
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Articles */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Articles</h2>
            <Link
              href="/admin/knowledge-base/articles"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          {recentArticles.length === 0 ? (
            <div className="p-8 text-center">
              <DocumentTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No articles yet</p>
              <Link
                href="/admin/knowledge-base/articles"
                className="text-blue-600 text-sm hover:underline"
              >
                Create your first article
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentArticles.map((article) => (
                <div key={article.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {article.category.name}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        article.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : article.status === "DRAFT"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {article.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-3 h-3" />
                      {article.viewCount} views
                    </span>
                    <span>
                      +{article.helpfulCount} / -{article.notHelpfulCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Release Notes */}
      <div className="mt-6 bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Release Notes</h2>
          </div>
          <Link
            href="/admin/release-notes"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all
          </Link>
        </div>
        {recentChanges.length === 0 ? (
          <div className="p-8 text-center">
            <SparklesIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No release notes yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentChanges.map((entry) => (
              <div key={entry.date} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="space-y-2">
                  {entry.sections.slice(0, 2).map((section) => (
                    <div key={section.title}>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded mr-2 ${
                          section.title === "Added"
                            ? "bg-green-100 text-green-800"
                            : section.title === "Fixed"
                            ? "bg-blue-100 text-blue-800"
                            : section.title === "Changed"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {section.title}
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {section.items.slice(0, 3).map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-600 pl-4 before:content-['•'] before:absolute before:left-0 relative"
                          >
                            {item}
                          </li>
                        ))}
                        {section.items.length > 3 && (
                          <li className="text-xs text-gray-400 pl-4">
                            +{section.items.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
