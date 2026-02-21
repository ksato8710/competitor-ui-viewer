import fs from "fs";
import path from "path";
import CompetitorUIView from "@/components/CompetitorUIView";
import type { Industry } from "@/lib/types";

function getIndustries(): Industry[] {
  const filePath = path.join(process.cwd(), "public", "data", "industries.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export default function Page() {
  const industries = getIndustries();
  return <CompetitorUIView industries={industries} />;
}
