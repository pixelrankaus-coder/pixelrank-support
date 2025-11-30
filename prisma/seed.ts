import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Well-known Claude AI agent user ID
const CLAUDE_AI_USER_ID = "claude-ai-agent-9999";

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

  // Create Claude AI system user
  // This user is used for all AI-generated actions (tasks, notes, etc.)
  const claudeAI = await prisma.user.upsert({
    where: { email: "claude@ai.system" },
    update: {
      name: "Claude AI",
      isAiAgent: true,
      role: "AGENT",
      jobTitle: "AI Assistant",
    },
    create: {
      id: CLAUDE_AI_USER_ID,
      email: "claude@ai.system",
      name: "Claude AI",
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10), // Random password, can't login
      role: "AGENT",
      isAiAgent: true,
      jobTitle: "AI Assistant",
      agentType: "AI_AGENT",
    },
  });

  console.log("Created Claude AI system user:", claudeAI.email);

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

  // Create default AI confidence configuration
  await prisma.aIConfidenceConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      taskAutoApprove: 0.85,     // Auto-approve tasks with 85%+ confidence
      taskDraft: 0.5,            // Tasks below 50% need review
      noteAutoApprove: 0.9,      // Notes need 90%+ for auto-approval
      autoApproveEnabled: false, // Disabled by default, enable after testing
      requireApprovalForNew: true,
    },
  });

  console.log("Created default AI confidence configuration");

  console.log("\n✅ Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("Email: support@pixelrank.com.au");
  console.log("Password: admin123");
  console.log("\n⚠️  Change your password after first login!");
  console.log("\n🤖 Claude AI system user created for AI-generated content");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
