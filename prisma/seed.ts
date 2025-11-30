import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "support@pixelrank.com.au" },
    update: {},
    create: {
      email: "support@pixelrank.com.au",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create ticket counter
  await prisma.counter.upsert({
    where: { id: "ticket_number" },
    update: {},
    create: {
      id: "ticket_number",
      value: 0,
    },
  });

  console.log("Created ticket counter");
  console.log("\n✅ Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("Email: support@pixelrank.com.au");
  console.log("Password: admin123");
  console.log("\n⚠️  Change your password after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
