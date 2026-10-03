import { prisma } from "@/lib/prisma";
import { DEMO_ORG_NAME } from "@/lib/constants";

export async function getDemoOrganizationId() {
  if (process.env.DEMO_ORGANIZATION_ID) {
    return process.env.DEMO_ORGANIZATION_ID;
  }

  const org = await prisma.organization.findFirst({
    where: { name: DEMO_ORG_NAME },
    select: { id: true },
  });

  if (!org) {
    throw new Error("Brak organizacji demo. Uruchom: pnpm db:seed");
  }

  return org.id;
}

export async function getDemoUser() {
  const organizationId = await getDemoOrganizationId();

  const user = await prisma.user.findFirst({
    where: { organizationId, role: "EMPLOYEE" },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    throw new Error("Brak użytkownika demo. Uruchom: pnpm db:seed");
  }

  return user;
}
