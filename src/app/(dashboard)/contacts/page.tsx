import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const pageSize = 25;

  const where = query
    ? {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      }
    : {};

  const [contacts, totalCount] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { tickets: true },
        },
        companyRef: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">All contacts</h1>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Select all checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Select all
          </label>

          {/* Search */}
          <form action="/contacts" method="GET" className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search all contacts"
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </form>
        </div>

        <div className="flex items-center gap-3">
          {/* Export/Import buttons */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Import
          </button>

          {/* Pagination */}
          <span className="text-sm text-gray-600">
            {totalCount > 0
              ? `${startIndex} - ${endIndex} of ${totalCount}`
              : "0 contacts"}
          </span>
          <div className="flex items-center">
            <Link
              href={`/contacts?q=${query}&page=${page - 1}`}
              className={`p-1.5 rounded-l border border-gray-300 ${
                page <= 1
                  ? "text-gray-300 pointer-events-none bg-gray-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Link>
            <Link
              href={`/contacts?q=${query}&page=${page + 1}`}
              className={`p-1.5 rounded-r border border-l-0 border-gray-300 ${
                page >= totalPages
                  ? "text-gray-300 pointer-events-none bg-gray-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email address
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Work phone
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Facebook
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Twitter
              </th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No contacts found
                </td>
              </tr>
            ) : (
              contacts.map((contact) => {
                const initial = (contact.name || contact.email || "?")
                  .charAt(0)
                  .toUpperCase();

                return (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {initial}
                        </div>
                        <span className="text-sm text-gray-900 group-hover:text-blue-600">
                          {contact.name || "(No name)"}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.title || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.companyRef ? (
                        <Link
                          href={`/companies/${contact.companyRef.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {contact.companyRef.name}
                        </Link>
                      ) : (
                        contact.company || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.workPhone || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.facebook || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.twitter || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
