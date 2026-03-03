"use client";

import type { ResearchReport } from "@/lib/types";
import TableOfContents from "./TableOfContents";
import MarkdownRenderer from "./MarkdownRenderer";
import SolutionMapTable from "./SolutionMapTable";
import Link from "next/link";

export default function ResearchDetail({
  report,
}: {
  report: ResearchReport;
}) {
  return (
    <div className="min-h-screen bg-bg-page">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm mb-6">
          <Link
            href="/"
            className="text-nav-text hover:text-nav-text-active hover:bg-nav-hover-bg px-1.5 py-0.5 rounded-md transition-colors"
          >
            ホーム
          </Link>
          <span className="text-nav-separator">/</span>
          <Link
            href="/research"
            className="text-nav-text hover:text-nav-text-active hover:bg-nav-hover-bg px-1.5 py-0.5 rounded-md transition-colors"
          >
            リサーチ
          </Link>
          <span className="text-nav-separator">/</span>
          <span className="text-nav-text-active font-medium px-1.5 py-0.5">
            {report.title}
          </span>
        </nav>

        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
          {/* Sidebar ToC — visible on lg+ */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <TableOfContents sections={report.sections} />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{report.icon}</span>
                <div>
                  <h1 className="text-2xl font-bold text-text-bright leading-tight">
                    {report.title}
                  </h1>
                  <p className="text-sm text-text-dim mt-1">
                    {report.titleEn}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs text-text-dim">{report.date}</span>
                <span className="text-xs text-text-dim">·</span>
                <span className="text-xs text-text-dim">
                  {report.readingTimeMinutes}分で読了
                </span>
                <div className="flex gap-1.5 ml-2">
                  {report.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-tag-bg text-tag-text border border-tag-border rounded-full px-2 py-0.5 text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </header>

            {/* Key Findings */}
            <section className="bg-score-high-bg border-l-4 border-score-high rounded-r-lg p-5 mb-8">
              <h2 className="text-sm font-semibold text-text-bright mb-3">
                主要な発見
              </h2>
              <ul className="space-y-2">
                {report.keyFindings.map((finding, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-text-primary"
                  >
                    <span className="text-score-high font-semibold shrink-0">
                      {i + 1}.
                    </span>
                    {finding}
                  </li>
                ))}
              </ul>
            </section>

            {/* Sections */}
            {report.sections.map((section) => (
              <section key={section.id} id={section.id} className="mb-10 scroll-mt-8">
                <h2 className="text-xl font-semibold text-text-bright mb-4 pb-2 border-b border-border">
                  {section.title}
                </h2>
                <MarkdownRenderer content={section.content} />

                {/* Solution map table after the comparison section */}
                {section.id === "solution-comparison" &&
                  report.solutionMap && (
                    <div className="mt-6">
                      <SolutionMapTable categories={report.solutionMap} />
                    </div>
                  )}

                {/* Recommendations list after the recommendations section */}
                {section.id === "recommendations" && (
                  <div className="mt-4 space-y-3">
                    {report.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-bg-card border border-border-card rounded-lg p-4"
                      >
                        <span className="bg-accent-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-text-primary leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
