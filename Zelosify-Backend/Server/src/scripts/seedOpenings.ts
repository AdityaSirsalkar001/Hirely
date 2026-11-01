import "dotenv/config";
import { OpeningStatus, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const openings = [
  ["Senior Full Stack Engineer", "Remote", "C2C", 5, 9, ["TypeScript", "React", "Node.js", "PostgreSQL"]],
  ["Cloud Platform Engineer", "New York, NY", "W2", 4, 8, ["AWS", "Kubernetes", "Terraform", "Docker"]],
  ["Frontend React Developer", "Remote", "C2C", 3, 6, ["React", "Next.js", "JavaScript", "CSS"]],
  ["Data Engineer", "Chicago, IL", "W2", 4, 7, ["Python", "SQL", "Spark", "Airflow"]],
  ["Security Analyst", "Remote", "C2C", 3, 6, ["SIEM", "Incident Response", "AWS", "Security"]],
  ["DevOps Engineer", "Austin, TX", "W2", 5, 10, ["CI/CD", "Docker", "Kubernetes", "Linux"]],
  ["Product Designer", "Remote", "C2C", 4, 8, ["Figma", "Prototyping", "Design Systems", "Accessibility"]],
  ["Backend Java Engineer", "Boston, MA", "W2", 5, 9, ["Java", "Spring Boot", "Microservices", "SQL"]],
  ["Machine Learning Engineer", "Remote", "C2C", 4, 8, ["Python", "Machine Learning", "PyTorch", "MLOps"]],
  ["QA Automation Engineer", "Seattle, WA", "W2", 3, 7, ["Playwright", "TypeScript", "API Testing", "CI/CD"]],
  ["Technical Project Manager", "Remote", "C2C", 6, 12, ["Agile", "Jira", "Stakeholder Management", "Cloud"]],
  ["Mobile Engineer", "Denver, CO", "W2", 3, 7, ["React Native", "TypeScript", "iOS", "Android"]],
] as const;

async function seedOpenings() {
  const demoCompanyName =
    process.env.DEMO_TENANT_COMPANY?.trim() || "Bruce Wayne Corp";
  const savedTenant = await prisma.$transaction(async (transaction) => {
    const tenant = await transaction.tenants.findFirst({
      where: {
        companyName: { equals: demoCompanyName, mode: "insensitive" },
      },
    });
    return tenant ?? transaction.tenants.create({
      data: { companyName: demoCompanyName },
    });
  });
  const manager = await prisma.user.findFirst({
    where: { tenantId: savedTenant.tenantId, role: Role.HIRING_MANAGER },
  });

  if (!manager) {
    console.log(JSON.stringify({
      event: "hiring_manager_required_before_opening_seed",
      tenantId: savedTenant.tenantId,
      companyName: demoCompanyName,
      instruction: `Register a HIRING_MANAGER user for ${demoCompanyName}, then run seed:openings again.`,
    }));
    return;
  }

  const openingCount = await prisma.$transaction(async (transaction) => {
    for (const [index, [title, location, contractType, experienceMin, experienceMax, requiredSkills]] of openings.entries()) {
      const id = `zelosify-demo-opening-${String(index + 1).padStart(2, "0")}`;
      await transaction.opening.upsert({
        where: { id },
        update: {
          tenantId: savedTenant.tenantId,
          title,
          location,
          contractType,
          hiringManagerId: manager.id,
          experienceMin,
          experienceMax,
          requiredSkills: [...requiredSkills],
          status: OpeningStatus.OPEN,
        },
        create: {
          id,
          tenantId: savedTenant.tenantId,
          title,
          description: `Contract opportunity for a ${title.toLowerCase()}.`,
          location,
          contractType,
          hiringManagerId: manager.id,
          experienceMin,
          experienceMax,
          requiredSkills: [...requiredSkills],
        },
      });
    }
    return openings.length;
  });

  console.log(JSON.stringify({ event: "hiring_openings_seeded", tenantId: savedTenant.tenantId, openingCount }));
}

seedOpenings()
  .catch((error) => {
    console.error(JSON.stringify({ event: "hiring_openings_seed_failed", error: error instanceof Error ? error.message : "unknown" }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
