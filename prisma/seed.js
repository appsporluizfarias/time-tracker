const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
require("dotenv/config");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 12);
  const adminPassword = await bcrypt.hash("Admin@1234", 12);

  const [owner, admin, dev1, dev2, viewer] = await Promise.all([
    prisma.user.upsert({
      where: { email: "luiznavore@gmail.com" },
      update: { role: "ADMIN", active: true, approved: true },
      create: {
        name: "Luiz Navore",
        email: "luiznavore@gmail.com",
        password: adminPassword,
        role: "ADMIN",
        active: true,
        approved: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "admin@demo.com" },
      update: {},
      create: {
        name: "Admin User",
        email: "admin@demo.com",
        password: hashedPassword,
        role: "ADMIN",
        active: true,
        approved: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "dev1@demo.com" },
      update: {},
      create: {
        name: "Alice Dev",
        email: "dev1@demo.com",
        password: hashedPassword,
        role: "DEV",
        active: true,
        approved: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "dev2@demo.com" },
      update: {},
      create: {
        name: "Bob Dev",
        email: "dev2@demo.com",
        password: hashedPassword,
        role: "DEV",
        active: true,
        approved: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "viewer@demo.com" },
      update: {},
      create: {
        name: "Viewer User",
        email: "viewer@demo.com",
        password: hashedPassword,
        role: "VIEWER",
        active: true,
        approved: true,
      },
    }),
  ]);

  const acmeClient = await prisma.client.upsert({
    where: { id: "acme-client" },
    update: {},
    create: { id: "acme-client", name: "Acme Corp", email: "billing@acme.com", company: "Acme Corporation" },
  });

  const startupClient = await prisma.client.upsert({
    where: { id: "startup-client" },
    update: {},
    create: { id: "startup-client", name: "Startup Inc", email: "contact@startup.io", company: "Startup Inc." },
  });

  const project1 = await prisma.project.upsert({
    where: { id: "project-alpha" },
    update: {},
    create: { id: "project-alpha", name: "Project Alpha", description: "Main product development", color: "#6366f1", clientId: acmeClient.id },
  });

  const project2 = await prisma.project.upsert({
    where: { id: "project-beta" },
    update: {},
    create: { id: "project-beta", name: "Beta Platform", description: "New platform rewrite", color: "#10b981", clientId: startupClient.id },
  });

  const sprint1 = await prisma.sprint.upsert({
    where: { id: "sprint-1" },
    update: {},
    create: { id: "sprint-1", name: "Sprint 1", startDate: new Date("2026-04-01"), endDate: new Date("2026-04-14"), projectId: project1.id },
  });

  const sprint2 = await prisma.sprint.upsert({
    where: { id: "sprint-2" },
    update: {},
    create: { id: "sprint-2", name: "Sprint 2", startDate: new Date("2026-04-15"), endDate: new Date("2026-04-28"), projectId: project1.id },
  });

  const tasks = await Promise.all([
    prisma.task.upsert({ where: { id: "task-1" }, update: {}, create: { id: "task-1", title: "Setup authentication", status: "DONE", projectId: project1.id, sprintId: sprint1.id } }),
    prisma.task.upsert({ where: { id: "task-2" }, update: {}, create: { id: "task-2", title: "Build dashboard UI", status: "IN_PROGRESS", projectId: project1.id, sprintId: sprint2.id } }),
    prisma.task.upsert({ where: { id: "task-3" }, update: {}, create: { id: "task-3", title: "API integration", status: "TODO", projectId: project2.id } }),
  ]);

  const devUsers = [dev1.id, dev2.id, owner.id];
  const now = new Date();
  const entries = [];
  for (let i = 0; i < 20; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    entries.push(
      prisma.timeEntry.create({
        data: {
          date,
          hours: (Math.floor(Math.random() * 8) + 1) + 0.5 * Math.floor(Math.random() * 2),
          description: ["Implemented feature", "Fixed bug", "Code review", "Planning", "Testing"][Math.floor(Math.random() * 5)],
          billable: Math.random() > 0.2,
          userId: devUsers[Math.floor(Math.random() * devUsers.length)],
          projectId: [project1.id, project2.id][Math.floor(Math.random() * 2)],
          clientId: [acmeClient.id, startupClient.id][Math.floor(Math.random() * 2)],
          sprintId: Math.random() > 0.5 ? sprint2.id : sprint1.id,
          taskId: tasks[Math.floor(Math.random() * tasks.length)].id,
        },
      })
    );
  }
  await Promise.all(entries);

  console.log("\nSeeding complete!");
  console.log("─".repeat(45));
  console.log("  luiznavore@gmail.com / Admin@1234  (Admin)");
  console.log("  admin@demo.com       / password123 (Admin)");
  console.log("  dev1@demo.com        / password123 (Dev)");
  console.log("  dev2@demo.com        / password123 (Dev)");
  console.log("  viewer@demo.com      / password123 (Viewer)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
