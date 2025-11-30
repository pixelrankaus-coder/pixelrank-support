import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SLAPolicyEditClient } from "./sla-policy-edit-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SLAPolicyEditPage({ params }: PageProps) {
  const { id } = await params;

  const policy = await prisma.sLAPolicy.findUnique({
    where: { id },
    include: {
      targets: {
        orderBy: {
          priority: "asc",
        },
      },
    },
  });

  if (!policy) {
    notFound();
  }

  return <SLAPolicyEditClient policy={policy} />;
}
