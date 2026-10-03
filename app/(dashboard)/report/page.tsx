import { Header } from "@/components/layout/header";
import { ThreatForm } from "@/components/report/threat-form";

export default function ReportPage() {
  return (
    <div>
      <Header
        title="Zgłoś / Sprawdź zagrożenie"
        description="Pracownik wkleja podejrzaną wiadomość — system analizuje ją AI i zapisuje incydent."
      />
      <ThreatForm />
    </div>
  );
}
