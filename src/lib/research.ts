import fs from "fs";
import path from "path";
import type { ResearchReportMeta, ResearchReport } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

export function getResearchIndex(): ResearchReportMeta[] {
  const filePath = path.join(DATA_DIR, "research-reports.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function getResearchReport(slug: string): ResearchReport | null {
  const filePath = path.join(
    DATA_DIR,
    "research-reports",
    slug,
    "report.json",
  );
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function getAllResearchSlugs(): string[] {
  return getResearchIndex().map((r) => r.id);
}
