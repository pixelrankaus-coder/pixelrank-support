import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TopHeader } from "./top-header";

export async function HeaderWrapper() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Fetch user with avatar
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });

  if (!user) {
    return null;
  }

  return <TopHeader user={user} />;
}
