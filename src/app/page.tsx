import fs from "fs";
import path from "path";
import CompetitorUIView from "@/components/CompetitorUIView";
import ResearchHighlightSection from "@/components/research/ResearchHighlightSection";
import { getResearchIndex } from "@/lib/research";
import type { Industry } from "@/lib/types";

function getIndustries(): Industry[] {
  const filePath = path.join(process.cwd(), "public", "data", "industries.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export default function Page() {
  const industries = getIndustries();
  const researchReports = getResearchIndex();
  return (
    <>
      <CompetitorUIView industries={industries} />
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <ResearchHighlightSection reports={researchReports} />
      </div>
    </>
  );
}
