import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "このサイトについて — Competitor UI Viewer",
  description:
    "デジタルプロダクトのUI・UX・サービス設計を横断的にリサーチ・比較し、知見を統合するプラットフォーム",
};

/* ─── Feature card data ─────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: "🏢",
    title: "業界別アプリ UI カタログ",
    description:
      "金融・EC・ヘルスケア・旅行など業界ごとに主要アプリのUIを収録。プラットフォーム別（iOS / Android / Web）にスクリーンショットと特徴を一覧できます。",
    link: { href: "/", label: "カタログを見る" },
  },
  {
    icon: "🤖",
    title: "自動分析パイプライン",
    description:
      "URLを指定するだけで、Playwright によるスクリーンショット撮影から Claude Vision API による AI 分析、HTMLレポート生成までを自動実行。手動では困難な大規模比較を実現します。",
  },
  {
    icon: "🔬",
    title: "UX リサーチレポート",
    description:
      "特定テーマを深掘りした調査レポートを公開。認証UX、オンボーディング、決済フローなど、サービス横断で設計パターンを比較分析します。",
    link: { href: "/research", label: "レポートを見る" },
  },
  {
    icon: "🔗",
    title: "MCP 連携",
    description:
      "Model Context Protocol サーバーを内蔵し、Claude Code などの AI ツールから分析結果の登録・検索・比較をプログラマティックに実行できます。",
  },
] satisfies readonly {
  icon: string;
  title: string;
  description: string;
  link?: { href: string; label: string };
}[];

const TARGETS = [
  {
    icon: "🎯",
    label: "プロダクトマネージャー",
    description: "競合の動向把握、機能比較、意思決定の根拠づくり",
  },
  {
    icon: "🎨",
    label: "UX デザイナー",
    description: "UI パターンの調査、ベストプラクティスの発見",
  },
  {
    icon: "💻",
    label: "フロントエンド開発者",
    description: "実装アプローチの比較、技術選定の参考",
  },
  {
    icon: "📋",
    label: "サービス企画者",
    description: "市場調査、UX トレンドの把握、企画立案の材料",
  },
] as const;

/* ─── Page component ────────────────────────────────────────────────── */

export default function AboutPage() {
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
            このサイトについて
          </span>
        </nav>

        {/* Hero */}
        <section className="mb-12">
          <h1 className="text-2xl font-bold text-text-bright mb-3">
            このサイトについて
          </h1>
          <p className="text-sm text-text-dim leading-relaxed max-w-2xl">
            Competitor UI Viewer は、デジタルプロダクトの
            <strong className="text-text-bright"> UI・UX・サービス設計</strong>
            を横断的にリサーチ・比較し、得られた知見を統合するプラットフォームです。
          </p>
        </section>

        {/* Vision */}
        <section className="mb-12">
          <SectionHeading icon="🌱" title="ビジョン" />
          <div className="bg-bg-card border border-border-card rounded-xl shadow-[var(--shadow-card)] p-6">
            <p className="text-sm text-text-primary leading-relaxed mb-4">
              優れたプロダクトは、優れた観察から生まれる。
            </p>
            <p className="text-sm text-text-dim leading-relaxed mb-4">
              UI のスクリーンショットを眺めるだけでなく、その背景にある UX
              設計の意図やサービス全体の戦略まで読み解くことで、本当に価値のあるインサイトが得られると考えています。
            </p>
            <p className="text-sm text-text-dim leading-relaxed">
              このサイトは、
              <strong className="text-text-primary">
                UI 分析・UX リサーチ・サービス比較
              </strong>
              という3つの視点を1つの場所に統合し、プロダクト開発に関わるすべての人のデザイン意思決定を支援することを目指しています。
            </p>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="mb-12">
          <SectionHeading icon="💎" title="提供価値" />
          <div className="grid gap-3 sm:grid-cols-3">
            <ValueCard
              title="定量的な比較"
              description="感覚ではなくデータで。AI による自動分析で、大規模な UI/UX 比較を実現します。"
            />
            <ValueCard
              title="深掘りリサーチ"
              description="表面的な違いだけでなく、設計思想やユーザー体験の構造を掘り下げて調査します。"
            />
            <ValueCard
              title="知見の統合"
              description="UI カタログ・分析レポート・リサーチを横断的につなぎ、文脈のあるインサイトを提供します。"
            />
          </div>
        </section>

        {/* Target Users */}
        <section className="mb-12">
          <SectionHeading icon="👥" title="想定する利用者" />
          <div className="grid gap-3 sm:grid-cols-2">
            {TARGETS.map((t) => (
              <div
                key={t.label}
                className="flex items-start gap-3 bg-bg-card border border-border-card rounded-xl shadow-[var(--shadow-card)] p-4"
              >
                <span className="text-xl mt-0.5">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-text-bright">
                    {t.label}
                  </p>
                  <p className="text-xs text-text-dim mt-0.5">
                    {t.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-12">
          <SectionHeading icon="⚡" title="主要機能" />
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-bg-card border border-border-card rounded-xl shadow-[var(--shadow-card)] p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-bright mb-1">
                      {f.title}
                    </h3>
                    <p className="text-xs text-text-dim leading-relaxed">
                      {f.description}
                    </p>
                    {f.link && (
                      <Link
                        href={f.link.href}
                        className="inline-block mt-2 text-xs text-accent-blue hover:text-text-link-hover transition-colors"
                      >
                        {f.link.label} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-12">
          <SectionHeading icon="🛠" title="技術スタック" />
          <div className="bg-bg-card border border-border-card rounded-xl shadow-[var(--shadow-card)] p-5">
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 text-xs text-text-dim">
              <TechRow label="フレームワーク" value="Next.js 15 (App Router)" />
              <TechRow label="UI" value="React 19 + Tailwind CSS 4" />
              <TechRow label="ブラウザ操作" value="Playwright" />
              <TechRow label="AI 分析" value="Claude Vision API" />
              <TechRow label="データベース" value="Turso (libSQL)" />
              <TechRow label="デプロイ" value="Vercel" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <p className="text-sm text-text-dim mb-4">
            カタログを探索するか、リサーチレポートを読んでみてください。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-blue rounded-lg hover:opacity-90 transition-opacity"
            >
              UI カタログへ
            </Link>
            <Link
              href="/research"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-accent-blue bg-bg-card border border-border-card rounded-lg hover:border-border-strong transition-colors shadow-[var(--shadow-card)]"
            >
              リサーチレポートへ
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold text-text-bright mb-4">
      <span>{icon}</span>
      {title}
    </h2>
  );
}

function ValueCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-bg-card border border-border-card rounded-xl shadow-[var(--shadow-card)] p-5">
      <h3 className="text-sm font-semibold text-text-bright mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-text-dim leading-relaxed">{description}</p>
    </div>
  );
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-text-primary font-medium">{label}</span>
      <span className="text-text-dim">—</span>
      <span>{value}</span>
    </div>
  );
}
