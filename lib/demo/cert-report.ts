import type { AuditLog, Organization, SecurityIncident } from "@prisma/client";
import { completeText, isOpenRouterConfigured } from "@/lib/openrouter/client";

export type DemoEventSeed = {
  level: "INFO" | "WARNING" | "CRITICAL" | "ACTION";
  minutesAgo: number;
  message: string;
};

export const DEMO_RANSOMWARE_EVENTS: DemoEventSeed[] = [
  {
    level: "INFO",
    minutesAgo: 20,
    message:
      "Pracownik działu finansów zgłosił podejrzaną wiadomość e-mail (faktura-korekta.pdf.exe).",
  },
  {
    level: "WARNING",
    minutesAgo: 18,
    message:
      "Moduł AI ocenił załącznik jako złośliwe oprogramowanie (Ransomware/Trojan).",
  },
  {
    level: "CRITICAL",
    minutesAgo: 15,
    message:
      "Wykryto nietypowy ruch sieciowy i masowe szyfrowanie plików na stacji roboczej PC-FIN-04.",
  },
  {
    level: "ACTION",
    minutesAgo: 13,
    message:
      "Administrator aktywował procedurę awaryjną: odizolowano stację roboczą od sieci LAN/Wi-Fi.",
  },
  {
    level: "ACTION",
    minutesAgo: 8,
    message: "Zabezpieczono logi systemowe i powiadomiono zarząd.",
  },
];

const CERT_SYSTEM_PROMPT =
  "Jesteś starszym analitykiem CSIRT przygotowującym oficjalny raport incydentu dla CERT Polska oraz Inspektora Ochrony Danych (RODO). " +
  "Na podstawie dostarczonych zdarzeń z systemu Cyber Strażnik wygeneruj profesjonalny raport w języku polskim, w formacie Markdown. " +
  "Nie wymyślaj faktów spoza logów. Jeśli brakuje danych, zaznacz to jako 'wymaga uzupełnienia'. " +
  "Struktura raportu (użyj nagłówków ##):\n" +
  "1. Metadane raportu (ID incydentu, organizacja, data, klasyfikacja)\n" +
  "2. Streszczenie wykonawcze (3-5 zdań)\n" +
  "3. Kwalifikacja incydentu (typ, poziom krytyczności, kategorie MITRE ATT&CK jeśli możliwe)\n" +
  "4. Oś czasu zdarzeń (tabela: Czas | Poziom | Opis)\n" +
  "5. Analiza techniczna i wpływ na organizację\n" +
  "6. Działania zaradcze podjęte i zalecane\n" +
  "7. Aspekty RODO (kategorie danych, ryzyko, obowiązek zgłoszenia do UODO w 72h)\n" +
  "8. Rekomendacje dla zarządu\n" +
  "Ton: rzeczowy, urzędowy, gotowy do przekazania organom nadzorczym.";

function formatEventLine(log: AuditLog): string {
  const time = new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(log.occurredAt);
  return `[${time}] [${log.level}] ${log.message}`;
}

function buildFallbackReport(
  organization: Organization,
  incident: SecurityIncident,
  logs: AuditLog[],
): string {
  const now = new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  const timeline = logs
    .map(
      (log) =>
        `| ${new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(log.occurredAt)} | ${log.level} | ${log.message} |`,
    )
    .join("\n");

  return `# Raport incydentu cyberbezpieczeństwa

## Metadane raportu
- **ID incydentu:** ${incident.id}
- **Organizacja:** ${organization.name}
- **Data raportu:** ${now}
- **Klasyfikacja:** Ransomware / Phishing (wysoka krytyczność)
- **System źródłowy:** Cyber Strażnik

## Streszczenie wykonawcze
W ciągu ostatnich 20 minut w ${organization.name} wykryto incydent związany z podejrzaną wiadomością e-mail z załącznikiem \`faktura-korekta.pdf.exe\`. Moduł AI sklasyfikował zagrożenie jako ransomware/trojan. Na stacji PC-FIN-04 zaobserwowano masowe szyfrowanie plików. Administrator odizolował urządzenie od sieci i zabezpieczył logi. Incydent wymaga dalszej analizy forensycznej i oceny obowiązków RODO.

## Kwalifikacja incydentu
- **Typ:** Ransomware (początek wektora: phishing e-mail)
- **Poziom krytyczności:** WYSOKI
- **MITRE ATT&CK:** T1566 (Phishing), T1486 (Data Encrypted for Impact)

## Oś czasu zdarzeń
| Czas | Poziom | Opis |
|------|--------|------|
${timeline}

## Analiza techniczna i wpływ
- Podejrzany wektor: e-mail z załącznikiem wykonywalnym podszywającym się pod fakturę.
- Dotknięte zasoby: stacja robocza PC-FIN-04 (dział finansów).
- Potencjalny wpływ: utrata dostępu do plików, ryzyko lateral movement w sieci LAN.

## Działania zaradcze
1. Izolacja stacji PC-FIN-04 od sieci.
2. Zabezpieczenie logów systemowych.
3. Powiadomienie zarządu.
4. **Zalecane:** pełna analiza malware, weryfikacja kopii zapasowych, reset haseł kont powiązanych.

## Aspekty RODO
- Możliwe kategorie danych: dane pracowników, dane kontrahentów/finansowe (wymaga uzupełnienia po inwentaryzacji).
- Ryzyko: wysokie — szyfrowanie może dotyczyć danych osobowych.
- **Obowiązek zgłoszenia do UODO:** do oceny w ciągu 72h od ustalenia naruszenia.

## Rekomendacje dla zarządu
- Aktywować pełną procedurę CSIRT/CERT.
- Rozważyć zgłoszenie na incydent.cert.pl.
- Przeprowadzić szkolenie antyphishingowe w dziale finansów.
`;
}

export async function generateCertReportMarkdown(
  organization: Organization,
  incident: SecurityIncident,
  logs: AuditLog[],
): Promise<string> {
  const eventLog = logs.map(formatEventLine).join("\n");

  if (!isOpenRouterConfigured()) {
    return buildFallbackReport(organization, incident, logs);
  }

  try {
    return await completeText({
      system: CERT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            `Wygeneruj raport CERT/RODO dla organizacji: ${organization.name}\n` +
            `ID incydentu: ${incident.id}\n` +
            `Tytuł: ${incident.title}\n` +
            `Dział: ${incident.department ?? "Finanse"}\n\n` +
            `Zdarzenia z AuditLog:\n${eventLog}`,
        },
      ],
      maxTokens: 4000,
      event: "cert_report",
    });
  } catch {
    return buildFallbackReport(organization, incident, logs);
  }
}

export function occurredAtMinutesAgo(minutesAgo: number): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date;
}
