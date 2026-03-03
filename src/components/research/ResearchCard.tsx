import Link from "next/link";
import type { ResearchReportMeta } from "@/lib/types";

export default function ResearchCard({
  report,
}: {
  report: ResearchReportMeta;
}) {
  return (
    <Link
      href={`/research/${report.id}`}
      className="group block bg-bg-card border border-border-card rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl shrink-0">{report.icon}</span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text-bright group-hover:text-accent-blue transition-colors leading-snug">
              {report.title}
            </h3>
            <p className="text-xs text-text-dim mt-1">{report.titleEn}</p>
          </div>
        </div>

        <p className="text-sm text-text-primary leading-relaxed mb-3">
          {report.summary}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {report.tags.map((tag) => (
              <span
                key={tag}
                className="bg-tag-bg text-tag-text border border-tag-border rounded-full px-2 py-0.5 text-[11px]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-dim shrink-0 ml-3">
            <span>{report.date}</span>
            <span>·</span>
            <span>{report.readingTimeMinutes}分</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
