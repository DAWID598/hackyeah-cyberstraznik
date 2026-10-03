import { PrismaClient } from "@prisma/client";
import { DEMO_ORG_NAME } from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: {
      id: "demo-org",
      name: DEMO_ORG_NAME,
      sector: "Administracja publiczna",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@demo.pl" },
    update: {},
    create: {
      email: "admin@demo.pl",
      name: "Anna Kowalska",
      role: "ADMIN",
      organizationId: org.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "pracownik@demo.pl" },
    update: {},
    create: {
      email: "pracownik@demo.pl",
      name: "Jan Nowak",
      role: "EMPLOYEE",
      organizationId: org.id,
    },
  });

  const ransomware = await prisma.playbook.upsert({
    where: { id: "playbook-ransomware" },
    update: {},
    create: {
      id: "playbook-ransomware",
      title: "Ransomware — pierwsze 60 minut",
      description:
        "Procedura dla administratora IT w urzędzie gminy po wykryciu szyfrowania plików.",
      threatType: "ransomware",
      isGlobal: true,
    },
  });

  const phishing = await prisma.playbook.upsert({
    where: { id: "playbook-phishing" },
    update: {},
    create: {
      id: "playbook-phishing",
      title: "Phishing — reakcja na kliknięty link",
      description: "Kroki gdy pracownik kliknął podejrzany link lub podał dane.",
      threatType: "phishing",
      isGlobal: true,
    },
  });

  const ransomwareSteps = [
    {
      order: 1,
      title: "Odłącz zainfekowane urządzenia od sieci",
      description: "Wyłącz Wi-Fi, odłącz kabel Ethernet. Nie wyłączaj komputera — zachowaj RAM.",
      isCritical: true,
    },
    {
      order: 2,
      title: "Powiadom kierownictwo i zespół IT",
      description: "Aktywuj kanał kryzysowy (telefon, Teams). Nie dyskutuj publicznie o incydencie.",
      isCritical: true,
    },
    {
      order: 3,
      title: "Zidentyfikuj zakres — które systemy dotknięte",
      description: "Sprawdź serwer plików, kopie zapasowe, konta z uprawnieniami admina.",
      isCritical: false,
    },
    {
      order: 4,
      title: "Nie płac okupu — zgłoś do CSIRT / CERT Polska",
      description: "Zgłoś incydent na incydent.cert.pl. Przygotuj logi i próbki złośliwego oprogramowania.",
      isCritical: true,
    },
    {
      order: 5,
      title: "Przywróć systemy z kopii zapasowych",
      description: "Po izolacji przywróć czyste obrazy systemów. Wymuś reset haseł krytycznych kont.",
      isCritical: false,
    },
  ];

  for (const step of ransomwareSteps) {
    await prisma.crisisStep.upsert({
      where: {
        playbookId_order: { playbookId: ransomware.id, order: step.order },
      },
      update: step,
      create: { ...step, playbookId: ransomware.id },
    });
  }

  const phishingSteps = [
    {
      order: 1,
      title: "Zresetuj hasło do skrzynki i kont powiązanych",
      description: "Wymuś zmianę hasła. Sprawdź reguły przekierowania maili i filtry.",
      isCritical: true,
    },
    {
      order: 2,
      title: "Wyloguj wszystkie sesje użytkownika",
      description: "W panelu Microsoft 365 / Google Workspace unieważnij aktywne sesje.",
      isCritical: true,
    },
    {
      order: 3,
      title: "Sprawdź logi logowania z ostatnich 48h",
      description: "Szukaj logowań z nietypowych lokalizacji i urządzeń.",
      isCritical: false,
    },
    {
      order: 4,
      title: "Poinformuj zespół o kampanii phishingowej",
      description: "Wyślij alert do pracowników z przykładem wiadomości i instrukcją zgłaszania.",
      isCritical: false,
    },
  ];

  for (const step of phishingSteps) {
    await prisma.crisisStep.upsert({
      where: {
        playbookId_order: { playbookId: phishing.id, order: step.order },
      },
      update: step,
      create: { ...step, playbookId: phishing.id },
    });
  }

  await prisma.securityIncident.createMany({
    data: [
      {
        title: "Fałszywa faktura od dostawcy",
        content: "Proszę o pilny przelew na nowe konto bankowe...",
        status: "SAFE",
        severity: "LOW",
        aiVerdict: "Safe",
        aiExplanation: "Brak typowych sygnałów phishingu.",
        aiConfidence: 0.82,
        organizationId: org.id,
      },
      {
        title: "Mail o zawieszeniu konta Microsoft",
        content: "Kliknij aby zweryfikować hasło w ciągu 2 godzin...",
        status: "THREAT",
        severity: "HIGH",
        aiVerdict: "Phishing",
        aiExplanation: "Presja czasowa i podejrzany link.",
        aiConfidence: 0.94,
        organizationId: org.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed OK — organizacja:", org.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
