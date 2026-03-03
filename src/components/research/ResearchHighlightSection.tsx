import Link from "next/link";
import type { ResearchReportMeta } from "@/lib/types";

export default function ResearchHighlightSection({
  reports,
}: {
  reports: ResearchReportMeta[];
}) {
  if (reports.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text-bright">
          UXリサーチレポート
        </h2>
        <Link
          href="/research"
          className="text-sm text-accent-blue hover:text-text-link-hover transition-colors"
        >
          すべて見る →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.slice(0, 3).map((report) => (
          <Link
            key={report.id}
            href={`/research/${report.id}`}
            className="group block bg-bg-card border border-border-card rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow p-5"
          >
            <div className="flex items-start gap-3 mb-2">
              <span className="text-2xl">{report.icon}</span>
              <h3 className="text-sm font-semibold text-text-bright group-hover:text-accent-blue transition-colors leading-snug">
                {report.title}
              </h3>
            </div>
            <p className="text-xs text-text-dim line-clamp-2">
              {report.summary}
            </p>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-text-dim">
              <span>{report.date}</span>
              <span>·</span>
              <span>{report.readingTimeMinutes}分</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
