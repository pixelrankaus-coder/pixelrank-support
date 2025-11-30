import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlazeClient } from "./blaze-client";

export const dynamic = "force-dynamic";

export default async function BlazePage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [companiesRaw, agents] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { contacts: true, projects: true },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize dates to strings for client component
  const companies = companiesRaw.map((company) => ({
    ...company,
    blazeStartDate: company.blazeStartDate?.toISOString() || null,
  }));

  return (
    <BlazeClient
      initialCompanies={companies}
      agents={agents}
      currentUserId={session.user.id}
    />
  );
}
