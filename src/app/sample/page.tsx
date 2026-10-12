import { publicMetadata } from "@/lib/seo";
export const metadata = publicMetadata("Hunchlane sample report · From idea to working product", "Explore a curated report on Hunchlane: official competitor sources, proposed advantages, risks, a customer pilot, planned capabilities, and illustrative costs.", "/sample");
import { sampleReport } from "@/core/sample";
import { ReportView } from "@/components/report-view";
export default function SamplePage() { return <ReportView report={sampleReport} sample/>; }
