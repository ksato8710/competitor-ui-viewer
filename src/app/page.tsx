import fs from "fs";
import path from "path";
import CompetitorUIView from "@/components/CompetitorUIView";
import type { CompetitorReport } from "@/lib/types";

function getReports(): CompetitorReport[] {
  const filePath = path.join(process.cwd(), "public", "data", "competitor-reports.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export default function Page() {
  const reports = getReports();
  return <CompetitorUIView reports={reports} />;
}
