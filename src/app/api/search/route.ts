import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface SearchResult {
  type: "ticket" | "contact" | "solution";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

// GET /api/search - Global search across tickets, contacts, and solutions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type"); // tickets, contacts, solutions, or all

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results: SearchResult[] = [];
    const searchQuery = query.toLowerCase();

    // Search tickets
    if (!type || type === "all" || type === "tickets") {
      const tickets = await prisma.ticket.findMany({
        where: {
          OR: [
            { subject: { contains: searchQuery } },
            { description: { contains: searchQuery } },
            { ticketNumber: isNaN(parseInt(query)) ? undefined : parseInt(query) },
          ],
        },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          contact: {
            select: { name: true, email: true },
          },
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      });

      results.push(
        ...tickets.map((ticket) => ({
          type: "ticket" as const,
          id: ticket.id,
          title: `#${ticket.ticketNumber} ${ticket.subject}`,
          subtitle: ticket.contact?.name || ticket.contact?.email || undefined,
          href: `/tickets/${ticket.id}`,
        }))
      );
    }

    // Search contacts
    if (!type || type === "all" || type === "contacts") {
      const contacts = await prisma.contact.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery } },
            { email: { contains: searchQuery } },
            { company: { contains: searchQuery } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      });

      results.push(
        ...contacts.map((contact) => ({
          type: "contact" as const,
          id: contact.id,
          title: contact.name || contact.email,
          subtitle: contact.email,
          href: `/contacts/${contact.id}`,
        }))
      );
    }

    // Search solutions (knowledge base articles)
    if (!type || type === "all" || type === "solutions") {
      const articles = await prisma.kBArticle.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: searchQuery } },
            { content: { contains: searchQuery } },
            { excerpt: { contains: searchQuery } },
          ],
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          slug: true,
          category: {
            select: { name: true },
          },
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      });

      results.push(
        ...articles.map((article) => ({
          type: "solution" as const,
          id: article.id,
          title: article.title,
          subtitle: article.category.name,
          href: `/help/articles/${article.slug}`,
        }))
      );
    }

    // Sort by relevance (exact matches first)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchQuery) ? 1 : 0;
      const bExact = b.title.toLowerCase().includes(searchQuery) ? 1 : 0;
      return bExact - aExact;
    });

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
