"use client";

import { useState, useTransition, useEffect } from "react";
import { createContact } from "@/lib/actions";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface Company {
  id: string;
  name: string;
}

export default function NewContactPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch(() => setCompanies([]));
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const company = formData.get("company") as string;
    const workPhone = formData.get("workPhone") as string;
    const facebook = formData.get("facebook") as string;
    const twitter = formData.get("twitter") as string;
    const companyId = formData.get("companyId") as string;

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    startTransition(async () => {
      try {
        await createContact({
          email: email.trim(),
          name: name?.trim(),
          title: title?.trim(),
          company: company?.trim(),
          workPhone: workPhone?.trim(),
          facebook: facebook?.trim(),
          twitter: twitter?.trim(),
          companyId: companyId || undefined,
        });
      } catch {
        setError("Failed to create contact");
      }
    });
  };

  return (
    <div className="p-6 overflow-auto h-full max-w-2xl">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to contacts
      </Link>

      <h1 className="text-2xl font-bold mb-6">Create New Contact</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <label
                htmlFor="workPhone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Work Phone
              </label>
              <input
                id="workPhone"
                name="workPhone"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="companyId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company
              </label>
              <select
                id="companyId"
                name="companyId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company (Text)
              </label>
              <input
                id="company"
                name="company"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Acme Inc. (if not in dropdown)"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Social Profiles (Optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="facebook"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Facebook
                </label>
                <input
                  id="facebook"
                  name="facebook"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="facebook.com/username"
                />
              </div>

              <div>
                <label
                  htmlFor="twitter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Twitter
                </label>
                <input
                  id="twitter"
                  name="twitter"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="@username"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Link
            href="/contacts"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Creating..." : "Create Contact"}
          </button>
        </div>
      </form>
    </div>
  );
}
