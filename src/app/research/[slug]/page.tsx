import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllResearchSlugs, getResearchReport } from "@/lib/research";
import ResearchDetail from "@/components/research/ResearchDetail";

export function generateStaticParams() {
  return getAllResearchSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = getResearchReport(slug);
  if (!report) return {};
  return {
    title: `${report.title} — Competitor UI Viewer`,
    description: report.summary,
  };
}

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = getResearchReport(slug);
  if (!report) notFound();
  return <ResearchDetail report={report} />;
}
