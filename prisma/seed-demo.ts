import { PrismaClient, TaskStatus, Priority } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo data...\n");

  // Get the admin user
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    console.error("❌ No admin user found. Run `npx prisma db seed` first.");
    process.exit(1);
  }

  console.log(`Found admin user: ${admin.email}`);

  // Helper function to find or create a company
  async function findOrCreateCompany(data: { name: string; website?: string }) {
    let company = await prisma.company.findFirst({ where: { name: data.name } });
    if (!company) {
      company = await prisma.company.create({ data });
    }
    return company;
  }

  // Create demo companies (SEO clients)
  const companies = await Promise.all([
    findOrCreateCompany({
      name: "TechStart Solutions",
      website: "https://techstart.com.au",
    }),
    findOrCreateCompany({
      name: "Green Earth Landscaping",
      website: "https://greenearthlandscaping.com.au",
    }),
    findOrCreateCompany({
      name: "Coastal Dental Care",
      website: "https://coastaldentalcare.com.au",
    }),
    findOrCreateCompany({
      name: "Urban Fitness Hub",
      website: "https://urbanfitnesshub.com.au",
    }),
    findOrCreateCompany({
      name: "Premier Property Group",
      website: "https://premierpropertygroup.com.au",
    }),
  ]);

  console.log(`✅ Created ${companies.length} demo companies`);

  // Helper to create dates relative to today
  const daysFromNow = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  const daysAgo = (days: number) => daysFromNow(-days);

  // Create projects with varied statuses
  const projects = await Promise.all([
    // Active project - On Track
    prisma.project.create({
      data: {
        name: "TechStart SEO Campaign Q4",
        description: "Full SEO campaign including technical audit, content strategy, and link building for Q4 2024.",
        status: "ACTIVE",
        companyId: companies[0].id,
        managerId: admin.id,
        startDate: daysAgo(45),
        dueDate: daysFromNow(45),
      },
    }),
    // Active project - At Risk (due soon, low progress)
    prisma.project.create({
      data: {
        name: "Green Earth Local SEO",
        description: "Local SEO optimization including Google Business Profile, local citations, and review management.",
        status: "ACTIVE",
        companyId: companies[1].id,
        managerId: admin.id,
        startDate: daysAgo(30),
        dueDate: daysFromNow(5),
      },
    }),
    // Active project - Blocked (has overdue tasks)
    prisma.project.create({
      data: {
        name: "Coastal Dental Website Redesign",
        description: "Complete website overhaul with SEO-optimized structure, location pages, and booking integration.",
        status: "ACTIVE",
        companyId: companies[2].id,
        managerId: admin.id,
        startDate: daysAgo(60),
        dueDate: daysAgo(5),
      },
    }),
    // On Hold project
    prisma.project.create({
      data: {
        name: "Urban Fitness Content Marketing",
        description: "Content marketing campaign including blog posts, video content, and social media integration.",
        status: "ON_HOLD",
        companyId: companies[3].id,
        managerId: admin.id,
        startDate: daysAgo(90),
        dueDate: daysFromNow(30),
      },
    }),
    // Completed project
    prisma.project.create({
      data: {
        name: "Premier Property SEO Audit",
        description: "Comprehensive technical SEO audit with recommendations and implementation plan.",
        status: "COMPLETED",
        companyId: companies[4].id,
        managerId: admin.id,
        startDate: daysAgo(120),
        dueDate: daysAgo(30),
        completedAt: daysAgo(25),
      },
    }),
    // Another active project
    prisma.project.create({
      data: {
        name: "TechStart Link Building Campaign",
        description: "Outreach campaign for high-quality backlinks from tech publications and industry blogs.",
        status: "ACTIVE",
        companyId: companies[0].id,
        managerId: admin.id,
        startDate: daysAgo(15),
        dueDate: daysFromNow(75),
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} demo projects`);

  // Create tasks for each project with varied statuses
  const taskData = [
    // TechStart SEO Campaign Q4 - Good progress
    { projectId: projects[0].id, title: "Initial keyword research", status: "DONE", priority: "HIGH", dueDate: daysAgo(30) },
    { projectId: projects[0].id, title: "Technical SEO audit", status: "DONE", priority: "HIGH", dueDate: daysAgo(20) },
    { projectId: projects[0].id, title: "Competitor analysis", status: "DONE", priority: "MEDIUM", dueDate: daysAgo(15) },
    { projectId: projects[0].id, title: "Content gap analysis", status: "IN_PROGRESS", priority: "MEDIUM", dueDate: daysFromNow(5) },
    { projectId: projects[0].id, title: "On-page optimization", status: "IN_PROGRESS", priority: "HIGH", dueDate: daysFromNow(10) },
    { projectId: projects[0].id, title: "Create landing pages", status: "TODO", priority: "MEDIUM", dueDate: daysFromNow(20) },
    { projectId: projects[0].id, title: "Internal linking structure", status: "TODO", priority: "LOW", dueDate: daysFromNow(30) },

    // Green Earth Local SEO - At risk
    { projectId: projects[1].id, title: "Google Business Profile optimization", status: "DONE", priority: "URGENT", dueDate: daysAgo(10) },
    { projectId: projects[1].id, title: "Local citation audit", status: "IN_PROGRESS", priority: "HIGH", dueDate: daysFromNow(2) },
    { projectId: projects[1].id, title: "Review generation strategy", status: "TODO", priority: "HIGH", dueDate: daysFromNow(4) },
    { projectId: projects[1].id, title: "Local schema markup", status: "TODO", priority: "MEDIUM", dueDate: daysFromNow(5) },

    // Coastal Dental - Has overdue tasks (blocked)
    { projectId: projects[2].id, title: "Site architecture planning", status: "DONE", priority: "HIGH", dueDate: daysAgo(45) },
    { projectId: projects[2].id, title: "Location page templates", status: "DONE", priority: "HIGH", dueDate: daysAgo(30) },
    { projectId: projects[2].id, title: "Content migration plan", status: "IN_PROGRESS", priority: "URGENT", dueDate: daysAgo(10) }, // Overdue!
    { projectId: projects[2].id, title: "301 redirect mapping", status: "TODO", priority: "HIGH", dueDate: daysAgo(5) }, // Overdue!
    { projectId: projects[2].id, title: "Launch checklist review", status: "TODO", priority: "URGENT", dueDate: daysFromNow(5) },

    // Urban Fitness - On Hold
    { projectId: projects[3].id, title: "Content calendar creation", status: "DONE", priority: "MEDIUM", dueDate: daysAgo(60) },
    { projectId: projects[3].id, title: "Blog post outlines", status: "IN_PROGRESS", priority: "MEDIUM", dueDate: daysAgo(30) },
    { projectId: projects[3].id, title: "Video content strategy", status: "TODO", priority: "LOW", dueDate: daysFromNow(30) },

    // Premier Property - Completed
    { projectId: projects[4].id, title: "Technical audit report", status: "DONE", priority: "HIGH", dueDate: daysAgo(90) },
    { projectId: projects[4].id, title: "Page speed optimization", status: "DONE", priority: "HIGH", dueDate: daysAgo(60) },
    { projectId: projects[4].id, title: "Mobile UX recommendations", status: "DONE", priority: "MEDIUM", dueDate: daysAgo(45) },
    { projectId: projects[4].id, title: "Final presentation", status: "DONE", priority: "HIGH", dueDate: daysAgo(30) },

    // TechStart Link Building
    { projectId: projects[5].id, title: "Prospect list creation", status: "DONE", priority: "HIGH", dueDate: daysAgo(7) },
    { projectId: projects[5].id, title: "Outreach email templates", status: "IN_PROGRESS", priority: "MEDIUM", dueDate: daysFromNow(3) },
    { projectId: projects[5].id, title: "Guest post pitches", status: "TODO", priority: "MEDIUM", dueDate: daysFromNow(14) },
    { projectId: projects[5].id, title: "HARO monitoring setup", status: "TODO", priority: "LOW", dueDate: daysFromNow(21) },
  ];

  for (const task of taskData) {
    await prisma.task.create({
      data: {
        title: task.title,
        projectId: task.projectId,
        status: task.status as TaskStatus,
        priority: task.priority as Priority,
        dueDate: task.dueDate,
        assigneeId: admin.id,
        createdById: admin.id,
        companyId: projects.find(p => p.id === task.projectId)?.companyId || null,
        completedAt: task.status === "DONE" ? daysAgo(Math.floor(Math.random() * 10)) : null,
      },
    });
  }

  console.log(`✅ Created ${taskData.length} demo tasks`);

  // Create deliverables for projects
  const deliverableData = [
    // TechStart SEO Campaign Q4
    { projectId: projects[0].id, name: "October Monthly Report", type: "MONTHLY_REPORT", status: "APPROVED", dueDate: daysAgo(5), deliveredAt: daysAgo(3) },
    { projectId: projects[0].id, name: "November Monthly Report", type: "MONTHLY_REPORT", status: "DELIVERED", dueDate: daysFromNow(2), deliveredAt: daysAgo(1) },
    { projectId: projects[0].id, name: "Technical Audit Report", type: "TECHNICAL_AUDIT", status: "APPROVED", dueDate: daysAgo(20), deliveredAt: daysAgo(22) },
    { projectId: projects[0].id, name: "Keyword Research Document", type: "KEYWORD_RESEARCH", status: "APPROVED", dueDate: daysAgo(30), deliveredAt: daysAgo(28) },
    { projectId: projects[0].id, name: "Q4 Content Calendar", type: "CONTENT_CALENDAR", status: "IN_PROGRESS", dueDate: daysFromNow(7) },
    { projectId: projects[0].id, name: "Competitor Analysis Report", type: "COMPETITOR_ANALYSIS", status: "DELIVERED", dueDate: daysAgo(10), deliveredAt: daysAgo(8) },

    // Green Earth Local SEO
    { projectId: projects[1].id, name: "Local SEO Audit", type: "TECHNICAL_AUDIT", status: "APPROVED", dueDate: daysAgo(20), deliveredAt: daysAgo(18) },
    { projectId: projects[1].id, name: "Citation Report", type: "OTHER", status: "IN_PROGRESS", dueDate: daysFromNow(3) },
    { projectId: projects[1].id, name: "November Monthly Report", type: "MONTHLY_REPORT", status: "PENDING", dueDate: daysFromNow(5) },

    // Coastal Dental
    { projectId: projects[2].id, name: "Site Architecture Plan", type: "TECHNICAL_AUDIT", status: "APPROVED", dueDate: daysAgo(40), deliveredAt: daysAgo(42) },
    { projectId: projects[2].id, name: "Content Migration Guide", type: "OTHER", status: "IN_PROGRESS", dueDate: daysAgo(5) }, // Overdue
    { projectId: projects[2].id, name: "Redirect Map", type: "OTHER", status: "PENDING", dueDate: daysAgo(3) }, // Overdue
    { projectId: projects[2].id, name: "October Monthly Report", type: "MONTHLY_REPORT", status: "DELIVERED", dueDate: daysAgo(10), deliveredAt: daysAgo(8) },

    // Urban Fitness - On Hold
    { projectId: projects[3].id, name: "Content Strategy Document", type: "CONTENT_CALENDAR", status: "APPROVED", dueDate: daysAgo(70), deliveredAt: daysAgo(72) },
    { projectId: projects[3].id, name: "Blog Post Templates", type: "CONTENT_PIECE", status: "DELIVERED", dueDate: daysAgo(50), deliveredAt: daysAgo(48) },

    // Premier Property - Completed
    { projectId: projects[4].id, name: "Technical Audit Report", type: "TECHNICAL_AUDIT", status: "APPROVED", dueDate: daysAgo(100), deliveredAt: daysAgo(102) },
    { projectId: projects[4].id, name: "SEO Recommendations", type: "OTHER", status: "APPROVED", dueDate: daysAgo(80), deliveredAt: daysAgo(78) },
    { projectId: projects[4].id, name: "Final Presentation Deck", type: "OTHER", status: "APPROVED", dueDate: daysAgo(35), deliveredAt: daysAgo(33), fileUrl: "https://drive.google.com/example" },

    // TechStart Link Building
    { projectId: projects[5].id, name: "Prospect Database", type: "OTHER", status: "DELIVERED", dueDate: daysAgo(5), deliveredAt: daysAgo(3) },
    { projectId: projects[5].id, name: "Link Building Report - Week 1", type: "LINK_BUILDING_REPORT", status: "PENDING", dueDate: daysFromNow(7) },
  ];

  for (const deliverable of deliverableData) {
    await prisma.deliverable.create({
      data: {
        name: deliverable.name,
        type: deliverable.type as any,
        status: deliverable.status as any,
        dueDate: deliverable.dueDate,
        deliveredAt: deliverable.deliveredAt || null,
        fileUrl: deliverable.fileUrl || null,
        projectId: deliverable.projectId,
      },
    });
  }

  console.log(`✅ Created ${deliverableData.length} demo deliverables`);

  console.log("\n🎉 Demo data seeded successfully!");
  console.log("\nSummary:");
  console.log(`  - ${companies.length} SEO client companies`);
  console.log(`  - ${projects.length} projects (various statuses)`);
  console.log(`  - ${taskData.length} tasks`);
  console.log(`  - ${deliverableData.length} deliverables`);
  console.log("\nVisit /projects to see the demo data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
