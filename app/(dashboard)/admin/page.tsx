import { CertReportDemo } from "@/components/demo/cert-report-demo";
import { Header } from "@/components/layout/header";

export default function AdminPage() {
  return (
    <div>
      <Header
        title="Panel administratora"
        description="Narzędzia demonstracyjne na hackathon — scenariusz incydentu i raport CERT/RODO generowany przez AI."
      />
      <CertReportDemo />
    </div>
  );
}
