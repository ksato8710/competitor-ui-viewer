import type { Metadata } from "next";
import { getResearchIndex } from "@/lib/research";
import ResearchCard from "@/components/research/ResearchCard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UXリサーチレポート — Competitor UI Viewer",
  description: "テーマ別の深掘りUXリサーチレポート一覧",
};

export default function ResearchIndexPage() {
  const reports = getResearchIndex();

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm mb-6">
          <Link
            href="/"
            className="text-nav-text hover:text-nav-text-active hover:bg-nav-hover-bg px-1.5 py-0.5 rounded-md transition-colors"
          >
            ホーム
          </Link>
          <span className="text-nav-separator">/</span>
          <span className="text-nav-text-active font-medium px-1.5 py-0.5">
            リサーチ
          </span>
        </nav>

        <h1 className="text-2xl font-bold text-text-bright mb-2">
          UXリサーチレポート
        </h1>
        <p className="text-sm text-text-dim mb-8">
          テーマ別に深掘りしたUXリサーチの調査レポート
        </p>

        <div className="space-y-4">
          {reports.map((report) => (
            <ResearchCard key={report.id} report={report} />
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-16 text-text-dim">
            <p className="text-lg mb-2">レポートがまだありません</p>
            <p className="text-sm">リサーチレポートが公開されるとここに表示されます</p>
          </div>
        )}
      </div>
    </div>
  );
}
