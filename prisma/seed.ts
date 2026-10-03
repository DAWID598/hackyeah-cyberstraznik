import { PrismaClient } from "@prisma/client";
import { DEMO_ORG_NAME } from "../lib/constants";

const prisma = new PrismaClient();

type PlaybookSeed = {
  id: string;
  title: string;
  description: string;
  threatType: string;
  steps: Array<{
    order: number;
    title: string;
    description: string;
    isCritical: boolean;
  }>;
};

const PLAYBOOKS: PlaybookSeed[] = [
  {
    id: "playbook-ransomware",
    title: "Ransomware — pierwsze 60 minut",
    description:
      "Procedura dla administratora IT w urzędzie gminy po wykryciu szyfrowania plików.",
    threatType: "ransomware",
    steps: [
      {
        order: 1,
        title: "Odłącz zainfekowane urządzenia od sieci",
        description:
          "Wyłącz Wi-Fi, odłącz kabel Ethernet. Nie wyłączaj komputera — zachowaj RAM.",
        isCritical: true,
      },
      {
        order: 2,
        title: "Powiadom kierownictwo i zespół IT",
        description:
          "Aktywuj kanał kryzysowy (telefon, Teams). Nie dyskutuj publicznie o incydencie.",
        isCritical: true,
      },
      {
        order: 3,
        title: "Zidentyfikuj zakres — które systemy dotknięte",
        description:
          "Sprawdź serwer plików, kopie zapasowe, konta z uprawnieniami admina.",
        isCritical: false,
      },
      {
        order: 4,
        title: "Nie płac okupu — zgłoś do CSIRT / CERT Polska",
        description:
          "Zgłoś incydent na incydent.cert.pl. Przygotuj logi i próbki złośliwego oprogramowania.",
        isCritical: true,
      },
      {
        order: 5,
        title: "Przywróć systemy z kopii zapasowych",
        description:
          "Po izolacji przywróć czyste obrazy systemów. Wymuś reset haseł krytycznych kont.",
        isCritical: false,
      },
    ],
  },
  {
    id: "playbook-phishing",
    title: "Phishing — reakcja na kliknięty link",
    description: "Kroki gdy pracownik kliknął podejrzany link lub podał dane.",
    threatType: "phishing",
    steps: [
      {
        order: 1,
        title: "Zresetuj hasło do skrzynki i kont powiązanych",
        description:
          "Wymuś zmianę hasła. Sprawdź reguły przekierowania maili i filtry.",
        isCritical: true,
      },
      {
        order: 2,
        title: "Wyloguj wszystkie sesje użytkownika",
        description:
          "W panelu Microsoft 365 / Google Workspace unieważnij aktywne sesje.",
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
        description:
          "Wyślij alert do pracowników z przykładem wiadomości i instrukcją zgłaszania.",
        isCritical: false,
      },
    ],
  },
  {
    id: "playbook-bec",
    title: "BEC — wyłudzenie finansowe (fałszywy przelew)",
    description:
      "Procedura gdy księgowość otrzymała mail z prośbą o pilny przelew na nowe konto.",
    threatType: "bec",
    steps: [
      {
        order: 1,
        title: "Wstrzymaj wszelkie przelewy związane ze zgłoszeniem",
        description:
          "Nie realizuj płatności do czasu telefonicznej weryfikacji z przełożonym.",
        isCritical: true,
      },
      {
        order: 2,
        title: "Zweryfikuj tożsamość nadawcy poza kanałem mailowym",
        description:
          "Zadzwoń na znany numer wewnętrzny. Nie używaj numeru z podejrzanego maila.",
        isCritical: true,
      },
      {
        order: 3,
        title: "Sprawdź nagłówki maila i domenę nadawcy",
        description:
          "Szukaj spoofingu (np. firma.pl vs flrma.pl). Zapisz dowody do raportu.",
        isCritical: false,
      },
      {
        order: 4,
        title: "Powiadom dział finansów i kierownictwo",
        description:
          "Uruchom procedurę anty-BEC. Ostrzeż inne jednostki organizacyjne.",
        isCritical: true,
      },
      {
        order: 5,
        title: "Zgłoś incydent do banku i policji (jeśli środki wysłane)",
        description:
          "Skontaktuj się z bankiem w trybie pilnym. Przygotuj opis transakcji.",
        isCritical: false,
      },
    ],
  },
  {
    id: "playbook-malware",
    title: "Malware — otwarty podejrzany załącznik",
    description: "Gdy pracownik uruchomił plik .zip, .docm lub makro z nieznanego maila.",
    threatType: "malware",
    steps: [
      {
        order: 1,
        title: "Odłącz komputer od sieci",
        description: "Natychmiast wyłącz Wi-Fi i kabel sieciowy.",
        isCritical: true,
      },
      {
        order: 2,
        title: "Nie restartuj i nie wyłączaj urządzenia",
        description: "Zachowaj procesy w pamięci do analizy forensycznej.",
        isCritical: true,
      },
      {
        order: 3,
        title: "Przekaż plik do analizy (sandbox / AV)",
        description: "Zapisz hash pliku. Nie otwieraj załącznika na innych maszynach.",
        isCritical: false,
      },
      {
        order: 4,
        title: "Sprawdź inne stacje w tej samej podsieci",
        description: "Szukaj nietypowego ruchu sieciowego i nowych procesów.",
        isCritical: false,
      },
      {
        order: 5,
        title: "Przeinstaluj system z czystego obrazu",
        description: "Po izolacji przywróć stan z backupu lub czystej instalacji.",
        isCritical: false,
      },
    ],
  },
  {
    id: "playbook-smishing",
    title: "Smishing — podejrzany SMS z linkiem",
    description: "Fałszywe powiadomienia kurierskie, bankowe lub urzędowe przez SMS.",
    threatType: "smishing",
    steps: [
      {
        order: 1,
        title: "Nie klikaj linku i nie dzwonij pod numer z SMS",
        description: "Zrób zrzut ekranu wiadomości jako dowód.",
        isCritical: true,
      },
      {
        order: 2,
        title: "Zablokuj numer nadawcy",
        description: "Zgłoś numer operatorze. Usuń wiadomość po zapisaniu dowodu.",
        isCritical: false,
      },
      {
        order: 3,
        title: "Sprawdź konto bankowe / aplikacje (jeśli kliknięto link)",
        description:
          "Zmień hasła, włącz 2FA. Skontaktuj się z bankiem jeśli podano dane.",
        isCritical: true,
      },
      {
        order: 4,
        title: "Ostrzeż pracowników o kampanii smishingowej",
        description: "Wyślij krótki alert z przykładem wiadomości.",
        isCritical: false,
      },
    ],
  },
  {
    id: "playbook-data-breach",
    title: "Wyciek danych — podejrzenie ujawnienia RODO",
    description:
      "Gdy podejrzewasz wyciek danych osobowych mieszkańców lub pracowników.",
    threatType: "data-breach",
    steps: [
      {
        order: 1,
        title: "Ustal zakres wycieku — jakie dane, ilu osób",
        description:
          "Lista kategorii danych (PESEL, adres, zdrowie). Nie usuwaj logów.",
        isCritical: true,
      },
      {
        order: 2,
        title: "Odizoluj źródło wycieku",
        description:
          "Zablokuj dostęp do systemu. Wymuś reset haseł uprzywilejowanych kont.",
        isCritical: true,
      },
      {
        order: 3,
        title: "Powiadom Inspektora Ochrony Danych (IOD)",
        description: "Przygotuj wstępny raport incydentu w ciągu 24h.",
        isCritical: true,
      },
      {
        order: 4,
        title: "Oceń obowiązek zgłoszenia do UODO (72h)",
        description:
          "Jeśli ryzyko dla praw osób — zgłoś naruszenie. Przygotuj komunikację.",
        isCritical: false,
      },
      {
        order: 5,
        title: "Poinformuj poszkodowanych (jeśli wymagane)",
        description:
          "Przygotuj jasny komunikat: co się stało, co robią, gdzie szukać pomocy.",
        isCritical: false,
      },
    ],
  },
  {
    id: "playbook-account-takeover",
    title: "Przejęcie konta — nietypowe logowania",
    description:
      "Gdy system wykrył logowania z obcego kraju lub masowe wysyłki spamu z konta.",
    threatType: "account-takeover",
    steps: [
      {
        order: 1,
        title: "Natychmiast zablokuj konto użytkownika",
        description: "Wyłącz konto w AD / M365. Zatrzymaj automatyczne reguły mailowe.",
        isCritical: true,
      },
      {
        order: 2,
        title: "Wyloguj wszystkie aktywne sesje",
        description: "Unieważnij tokeny OAuth i sesje na wszystkich urządzeniach.",
        isCritical: true,
      },
      {
        order: 3,
        title: "Wymuś reset hasła i włącz MFA",
        description: "Użytkownik zmienia hasło z czystego urządzenia.",
        isCritical: true,
      },
      {
        order: 4,
        title: "Przeanalizuj skrzynkę — reguły przekierowania i auto-odpowiedzi",
        description: "Usuń reguły dodane przez atakującego. Sprawdź kontakty.",
        isCritical: false,
      },
      {
        order: 5,
        title: "Sprawdź czy nie wysłano phishingu do kontaktów",
        description:
          "Przejrzyj folder Wysłane. Wyślij przeprosiny i ostrzeżenie do odbiorców.",
        isCritical: false,
      },
    ],
  },
];

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

  for (const playbook of PLAYBOOKS) {
    const record = await prisma.playbook.upsert({
      where: { id: playbook.id },
      update: {
        title: playbook.title,
        description: playbook.description,
        threatType: playbook.threatType,
      },
      create: {
        id: playbook.id,
        title: playbook.title,
        description: playbook.description,
        threatType: playbook.threatType,
        isGlobal: true,
      },
    });

    for (const step of playbook.steps) {
      await prisma.crisisStep.upsert({
        where: {
          playbookId_order: { playbookId: record.id, order: step.order },
        },
        update: step,
        create: { ...step, playbookId: record.id },
      });
    }
  }

  await prisma.securityIncident.createMany({
    data: [
      {
        title: "Fałszywa faktura od dostawcy",
        department: "Finanse",
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
        department: "IT",
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

  await prisma.alertChannel.upsert({
    where: { id: "demo-channel-slack" },
    update: {},
    create: {
      id: "demo-channel-slack",
      organizationId: org.id,
      name: "#it-security",
      type: "SLACK",
      webhookUrl: "https://hooks.slack.com/services/DEMO/REPLACE/WITH/REAL/URL",
      isEnabled: false,
      minSeverity: "HIGH",
    },
  });

  console.log(`Seed OK — ${PLAYBOOKS.length} playbooków, organizacja: ${org.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
