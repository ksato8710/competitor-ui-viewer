"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { CompetitorReport, CompetitorThumbnail } from "@/lib/types";

interface CompetitorUIViewProps {
  reports: CompetitorReport[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function avgScore(scores: { score: number }[]): number {
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((s, c) => s + c.score, 0) / scores.length) * 10) / 10;
}

function scoreColor(score: number): string {
  if (score >= 4) return "#059669";
  if (score >= 3) return "#d97706";
  return "#e11d48";
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function CompetitorUIView({ reports }: CompetitorUIViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [presetFilter, setPresetFilter] = useState<string>("all");
  const [previewImage, setPreviewImage] = useState<CompetitorThumbnail | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const presets = useMemo(() => {
    const set = new Set(reports.map((r) => r.preset));
    return ["all", ...Array.from(set).sort()];
  }, [reports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (presetFilter !== "all" && r.preset !== presetFilter) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const haystack = r.urls.join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [reports, presetFilter, debouncedSearch]);

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-10">
      {/* Header */}
      <header>
        <h1 className="text-center text-3xl font-extrabold text-text-bright mb-2">
          Competitor UI Viewer
        </h1>
        <p className="text-center text-sm text-text-dim mb-8">
          競合UIの自動撮影・分析レポート — サムネイル & プレビュー
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Reports" value={String(reports.length)} />
        <StatCard
          label="URLs Analyzed"
          value={String(new Set(reports.flatMap((r) => r.urls)).size)}
        />
        <StatCard
          label="Avg Score"
          value={
            reports.length > 0
              ? String(avgScore(reports.flatMap((r) => r.scores)))
              : "-"
          }
        />
        <StatCard
          label="Latest"
          value={
            reports.length > 0
              ? new Date(reports[0].timestamp).toLocaleDateString("ja-JP")
              : "-"
          }
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="URLで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-[10px] border border-border bg-bg-card text-[0.88rem] text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div className="flex gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setPresetFilter(p)}
              className={`px-3 py-1.5 rounded-[10px] text-[0.78rem] font-medium transition-colors ${
                presetFilter === p
                  ? "bg-accent-blue text-white"
                  : "bg-bg-hover text-text-dim hover:text-text-primary"
              }`}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {filtered.length === 0 ? (
        <EmptyState hasReports={reports.length > 0} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} onThumbnailClick={setPreviewImage} />
          ))}
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <ScreenshotPreview
          thumbnail={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* CLI Usage Hint */}
      <div className="mt-12 p-6 rounded-[14px] border border-border bg-bg-card">
        <h3 className="text-sm font-semibold text-text-bright mb-3">
          CLI Usage
        </h3>
        <div className="space-y-2 text-[0.82rem] text-text-dim font-mono">
          <p># product-hub で分析を実行</p>
          <p className="text-text-primary">pnpm competitor:analyze https://example.com</p>
          <p className="mt-2"># レポートをこのビューアに同期</p>
          <p className="text-text-primary">pnpm scan</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-[14px] border border-border bg-bg-card text-center">
      <div className="text-2xl font-bold text-text-bright">{value}</div>
      <div className="text-xs text-text-dim mt-1">{label}</div>
    </div>
  );
}

function ReportCard({
  report,
  onThumbnailClick,
}: {
  report: CompetitorReport;
  onThumbnailClick: (thumb: CompetitorThumbnail) => void;
}) {
  const avg = avgScore(report.scores);
  const domains = report.urls.map(domainOf);
  const color = scoreColor(avg);

  return (
    <div className="p-5 rounded-[14px] border border-border bg-bg-card hover:border-[rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-[0.82rem] font-semibold text-text-bright truncate">
            {domains.join(" vs ")}
          </div>
          <div className="text-[0.72rem] text-text-dim mt-0.5">
            {formatDate(report.timestamp)}
          </div>
        </div>
        {avg > 0 && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ml-3"
            style={{ background: color }}
          >
            {avg}
          </div>
        )}
      </div>

      {/* Scores per URL */}
      {report.scores.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {report.scores
            .filter((s) => s.viewport === "desktop")
            .map((s) => (
              <div key={s.url} className="flex items-center gap-2">
                <div className="text-[0.75rem] text-text-dim truncate flex-1">
                  {domainOf(s.url)}
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="w-4 h-1.5 rounded-sm"
                      style={{
                        background:
                          n <= s.score ? scoreColor(s.score) : "#e2e8f0",
                      }}
                    />
                  ))}
                </div>
                <div
                  className="text-[0.72rem] font-semibold w-5 text-right"
                  style={{ color: scoreColor(s.score) }}
                >
                  {s.score}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="px-2 py-0.5 rounded-full text-[0.7rem] bg-[#eff6ff] text-[#2563eb]">
          {report.preset}
        </span>
        {report.viewports.map((v) => (
          <span
            key={v}
            className={`px-2 py-0.5 rounded-full text-[0.7rem] ${
              v === "mobile"
                ? "bg-[#f5f3ff] text-[#7c3aed]"
                : "bg-[#f1f5f9] text-[#475569]"
            }`}
          >
            {v}
          </span>
        ))}
        {report.comparison && (
          <span className="px-2 py-0.5 rounded-full text-[0.7rem] bg-[#ecfdf5] text-[#059669]">
            compared
          </span>
        )}
      </div>

      {/* Thumbnail Grid */}
      {report.thumbnails && report.thumbnails.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {report.thumbnails.map((thumb) => (
            <button
              key={`${thumb.url}-${thumb.viewport}`}
              onClick={() => onThumbnailClick(thumb)}
              className="relative group rounded-lg overflow-hidden border border-border hover:border-accent-blue transition-all cursor-pointer"
            >
              <img
                src={thumb.foldPath}
                alt={`${domainOf(thumb.url)} ${thumb.viewport}`}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                <div className="text-[0.65rem] text-white font-medium truncate">
                  {domainOf(thumb.url)}
                </div>
                <div className="text-[0.58rem] text-white/70">
                  {thumb.viewport}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* View Report Link */}
      <a
        href={`/data/competitor-reports/${report.id}.html`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-accent-blue hover:underline"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        View Full Report
      </a>
    </div>
  );
}

function ScreenshotPreview({
  thumbnail,
  onClose,
}: {
  thumbnail: CompetitorThumbnail;
  onClose: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-bg-card rounded-[14px] border border-border shadow-2xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold text-text-bright">
              {domainOf(thumbnail.url)}
            </div>
            <div className="text-[0.72rem] text-text-dim">
              {thumbnail.viewport} viewport
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-bg-hover transition-colors text-text-dim hover:text-text-bright"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="overflow-auto p-4">
          <img
            src={thumbnail.foldPath}
            alt={`${domainOf(thumbnail.url)} - ${thumbnail.viewport}`}
            className="max-w-full h-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasReports }: { hasReports: boolean }) {
  return (
    <div className="text-center py-20 text-text-dim">
      <div className="text-5xl mb-4 opacity-30">
        {hasReports ? "🔍" : "📸"}
      </div>
      <div className="text-[0.95rem] mb-2">
        {hasReports
          ? "No reports match your filters"
          : "No competitor UI reports yet"}
      </div>
      {!hasReports && (
        <div className="text-[0.82rem] mt-4 max-w-md mx-auto">
          <p className="mb-2">product-hub で分析を実行してスキャン:</p>
          <code className="block bg-bg-hover px-4 py-2 rounded-lg text-text-primary text-left">
            pnpm competitor:analyze https://example.com
          </code>
          <p className="mt-2">このビューアに同期:</p>
          <code className="block bg-bg-hover px-4 py-2 rounded-lg text-text-primary text-left">
            pnpm scan
          </code>
        </div>
      )}
    </div>
  );
}
