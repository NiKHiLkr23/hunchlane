import { publicMetadata } from "@/lib/seo";
export const metadata = publicMetadata("Illustrative sample report · Hunchlane", "See an illustrative idea research report with alternatives, sources, possible angles, and a small next experiment. This sample is not live research.", "/sample");
import { sampleReport } from "@/core/sample";
import { ReportView } from "@/components/report-view";
export default function SamplePage() { return <ReportView report={sampleReport} sample/>; }
