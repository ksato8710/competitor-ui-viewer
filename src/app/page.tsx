import { Suspense } from "react";
import CompetitorUIView from "@/components/CompetitorUIView";
import ResearchHighlightSection from "@/components/research/ResearchHighlightSection";
import { getResearchIndex } from "@/lib/research";
import { getUnifiedIndustries } from "@/lib/get-industries";

export default async function Page() {
  const industries = await getUnifiedIndustries();
  const researchReports = getResearchIndex();
  return (
    <>
      <Suspense>
        <CompetitorUIView industries={industries} />
      </Suspense>
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <ResearchHighlightSection reports={researchReports} />
      </div>
    </>
  );
}
