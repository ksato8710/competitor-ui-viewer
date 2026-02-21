"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { Industry, Category, App, AppScreenshot } from "@/lib/types";

/* ─── Props ──────────────────────────────────────────────────────────── */

interface Props {
  industries: Industry[];
}

/* ─── View state ─────────────────────────────────────────────────────── */

type ViewState =
  | { type: "landing" }
  | { type: "industry"; industryId: string }
  | { type: "app"; industryId: string; appId: string };

/* ─── Industry colors ────────────────────────────────────────────────── */

const INDUSTRY_COLORS: Record<string, { gradient: string }> = {
  finance:       { gradient: "from-indigo-500/10 to-indigo-600/5" },
  news:          { gradient: "from-blue-500/10 to-blue-600/5" },
  ecommerce:     { gradient: "from-amber-500/10 to-amber-600/5" },
  food:          { gradient: "from-orange-500/10 to-orange-600/5" },
  healthcare:    { gradient: "from-teal-500/10 to-teal-600/5" },
  travel:        { gradient: "from-sky-500/10 to-sky-600/5" },
  communication: { gradient: "from-violet-500/10 to-violet-600/5" },
};

function getIndustryGradient(id: string) {
  return INDUSTRY_COLORS[id]?.gradient ?? "from-slate-500/10 to-slate-600/5";
}

/* ─── Platform badge ─────────────────────────────────────────────────── */

function PlatformBadge({ platform }: { platform: string }) {
  const styles: Record<string, string> = {
    iOS:     "bg-platform-ios-bg text-platform-ios",
    Android: "bg-platform-android-bg text-platform-android",
    Web:     "bg-platform-web-bg text-platform-web",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${styles[platform] ?? "bg-tag-bg text-tag-text"}`}>
      {platform}
    </span>
  );
}

/* ─── Breadcrumb ─────────────────────────────────────────────────────── */

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-nav-separator">/</span>}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-nav-text hover:text-nav-text-active hover:bg-nav-hover-bg px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-nav-text-active font-medium px-1.5 py-0.5">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ─── Search bar ─────────────────────────────────────────────────────── */

function SearchBar({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="relative">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-bg-input border border-border rounded-[10px] text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-border-focus focus:shadow-[var(--shadow-focus)] transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary p-0.5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ─── Stats header ───────────────────────────────────────────────────── */

function StatsBar({ industries }: { industries: Industry[] }) {
  const totalApps = industries.reduce(
    (sum, ind) => sum + ind.categories.reduce((s, cat) => s + cat.apps.length, 0),
    0
  );
  const totalCategories = industries.reduce((sum, ind) => sum + ind.categories.length, 0);

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {[
        { value: industries.length, label: "業界" },
        { value: totalCategories, label: "カテゴリ" },
        { value: totalApps, label: "アプリ" },
      ].map((stat) => (
        <div key={stat.label} className="bg-bg-card border border-border-card rounded-xl px-4 py-3 text-center shadow-[var(--shadow-card)]">
          <div className="text-2xl font-bold text-text-bright">{stat.value}</div>
          <div className="text-xs text-text-dim mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Industry card (landing) ────────────────────────────────────────── */

function IndustryCard({
  industry,
  onClick,
}: {
  industry: Industry;
  onClick: () => void;
}) {
  const gradient = getIndustryGradient(industry.id);
  const appCount = industry.categories.reduce((sum, cat) => sum + cat.apps.length, 0);

  return (
    <button
      onClick={onClick}
      className="group relative text-left w-full bg-bg-card border border-border-card rounded-2xl p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
      <div className="relative">
        <div className="text-3xl mb-3">{industry.icon}</div>
        <h3 className="text-base font-semibold text-text-bright mb-0.5">{industry.name}</h3>
        <p className="text-[11px] text-text-dim mb-3">{industry.nameEn}</p>
        <p className="text-xs text-text-dim leading-relaxed mb-4 line-clamp-2">{industry.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-text-dim">
            <span>{industry.categories.length} カテゴリ</span>
            <span>{appCount} アプリ</span>
          </div>
          <svg className="w-4 h-4 text-text-dim group-hover:text-accent-blue group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </button>
  );
}

/* ─── App card (within category) ─────────────────────────────────────── */

function AppCard({ app, onClick }: { app: App; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full bg-bg-card border border-border-card rounded-xl p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-text-bright truncate">{app.name}</h4>
          <p className="text-[11px] text-text-dim mt-0.5">{app.company}</p>
        </div>
        <svg className="w-4 h-4 text-text-dim group-hover:text-accent-blue shrink-0 ml-2 mt-0.5 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        {app.platform.map((p) => (
          <PlatformBadge key={p} platform={p} />
        ))}
      </div>

      <p className="text-xs text-text-dim leading-relaxed line-clamp-2 mb-3">{app.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {app.features.slice(0, 3).map((f) => (
          <span key={f} className="inline-flex px-2 py-0.5 bg-tag-bg text-tag-text rounded-md text-[11px]">
            {f}
          </span>
        ))}
        {app.features.length > 3 && (
          <span className="inline-flex px-2 py-0.5 text-text-dim text-[11px]">
            +{app.features.length - 3}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Category section ───────────────────────────────────────────────── */

function CategorySection({
  category,
  onAppClick,
}: {
  category: Category;
  onAppClick: (appId: string) => void;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-text-bright">{category.name}</h3>
        <span className="text-xs text-text-dim">({category.nameEn})</span>
        <span className="text-[11px] text-text-dim bg-tag-bg px-2 py-0.5 rounded-full">
          {category.apps.length} アプリ
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.apps.map((app) => (
          <AppCard key={app.id} app={app} onClick={() => onAppClick(app.id)} />
        ))}
      </div>
    </section>
  );
}

/* ─── Screenshot placeholder ─────────────────────────────────────────── */

function ScreenshotPlaceholder({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-[9/16] bg-bg-section border border-border-card rounded-xl overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-all cursor-pointer"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
        <svg className="w-8 h-8 text-text-placeholder mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span className="text-[11px] text-text-dim text-center leading-tight">{label}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
            スクリーンショット未登録
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── App detail view ────────────────────────────────────────────────── */

function AppDetailView({
  app,
  industry,
  category,
  onBack,
  onGoHome,
  onGoIndustry,
}: {
  app: App;
  industry: Industry;
  category: Category;
  onBack: () => void;
  onGoHome: () => void;
  onGoIndustry: () => void;
}) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(null);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "ホーム", onClick: onGoHome },
          { label: industry.name, onClick: onGoIndustry },
          { label: category.name, onClick: onBack },
          { label: app.name },
        ]}
      />

      {/* Header */}
      <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-[var(--shadow-card)] mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-bright mb-1">{app.name}</h2>
            <p className="text-sm text-text-dim mb-3">{app.company} ({app.companyEn})</p>
            <div className="flex items-center gap-2 mb-4">
              {app.platform.map((p) => (
                <PlatformBadge key={p} platform={p} />
              ))}
            </div>
            <p className="text-sm text-text-primary leading-relaxed max-w-2xl">{app.description}</p>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            {app.appUrl && (
              <a
                href={app.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                公式サイト
              </a>
            )}
            {app.appStoreUrl && (
              <a
                href={app.appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-platform-ios-bg text-platform-ios text-xs font-medium rounded-lg hover:opacity-80 transition-opacity"
              >
                App Store
              </a>
            )}
            {app.playStoreUrl && (
              <a
                href={app.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-platform-android-bg text-platform-android text-xs font-medium rounded-lg hover:opacity-80 transition-opacity"
              >
                Google Play
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Features & Strengths */}
        <div className="lg:col-span-1 space-y-6">
          {/* Features */}
          <div className="bg-bg-card border border-border-card rounded-xl p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold text-text-bright mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              主要機能
            </h3>
            <ul className="space-y-2">
              {app.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-1.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Strengths */}
          <div className="bg-bg-card border border-border-card rounded-xl p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold text-text-bright mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-score-high" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              UI/UXの強み
            </h3>
            <ul className="space-y-3">
              {app.strengths.map((s, i) => (
                <li key={i} className="text-sm text-text-primary bg-score-high-bg rounded-lg px-3 py-2">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column: Screenshots */}
        <div className="lg:col-span-2">
          <div className="bg-bg-card border border-border-card rounded-xl p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold text-text-bright mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              主要画面スクリーンショット
              <span className="text-[11px] font-normal text-text-dim">({app.screenshots.length} 画面)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {app.screenshots.map((ss, i) => (
                <ScreenshotPlaceholder
                  key={i}
                  label={ss.label}
                  onClick={() => setSelectedScreenshot(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot modal */}
      {selectedScreenshot !== null && (
        <ScreenshotModal
          screenshots={app.screenshots}
          currentIndex={selectedScreenshot}
          onClose={() => setSelectedScreenshot(null)}
          onNavigate={setSelectedScreenshot}
        />
      )}
    </div>
  );
}

/* ─── Screenshot modal ───────────────────────────────────────────────── */

function ScreenshotModal({
  screenshots,
  currentIndex,
  onClose,
  onNavigate,
}: {
  screenshots: AppScreenshot[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const current = screenshots[currentIndex];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < screenshots.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, screenshots.length, onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-50 bg-bg-overlay flex items-center justify-center p-8" onClick={onClose}>
      <div
        className="relative bg-bg-card rounded-2xl shadow-[var(--shadow-modal)] max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <h4 className="text-sm font-semibold text-text-bright">{current.label}</h4>
            <p className="text-[11px] text-text-dim">{currentIndex + 1} / {screenshots.length}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-hover rounded-lg transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex items-center justify-center min-h-[400px] bg-gallery-bg">
          <div className="flex flex-col items-center justify-center text-center">
            <svg className="w-16 h-16 text-text-placeholder mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <p className="text-sm text-text-dim mb-1">スクリーンショット未登録</p>
            <p className="text-[11px] text-text-placeholder">{current.path}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <button
            onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-primary hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            前へ
          </button>

          <div className="flex items-center gap-1.5">
            {screenshots.map((_, i) => (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                  i === currentIndex ? "bg-accent-blue" : "bg-bg-inset hover:bg-text-dim"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => currentIndex < screenshots.length - 1 && onNavigate(currentIndex + 1)}
            disabled={currentIndex === screenshots.length - 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-primary hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer"
          >
            次へ
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Search results ─────────────────────────────────────────────────── */

function SearchResults({
  industries,
  query,
  onAppClick,
}: {
  industries: Industry[];
  query: string;
  onAppClick: (industryId: string, appId: string) => void;
}) {
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches: { industry: Industry; category: Category; app: App }[] = [];
    for (const industry of industries) {
      for (const category of industry.categories) {
        for (const app of category.apps) {
          if (
            app.name.toLowerCase().includes(q) ||
            app.company.toLowerCase().includes(q) ||
            app.companyEn.toLowerCase().includes(q) ||
            app.description.toLowerCase().includes(q) ||
            app.features.some((f) => f.toLowerCase().includes(q)) ||
            industry.name.toLowerCase().includes(q) ||
            category.name.toLowerCase().includes(q)
          ) {
            matches.push({ industry, category, app });
          }
        }
      }
    }
    return matches;
  }, [industries, query]);

  if (!query.trim()) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 text-text-placeholder mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <p className="text-sm text-text-dim">アプリ名、企業名、機能で検索</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-text-dim">&ldquo;{query}&rdquo; に一致するアプリが見つかりません</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-text-dim mb-4">{results.length} 件のアプリが見つかりました</p>
      <div className="space-y-3">
        {results.map(({ industry, category, app }) => (
          <button
            key={app.id}
            onClick={() => onAppClick(industry.id, app.id)}
            className="w-full text-left bg-bg-card border border-border-card rounded-xl p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-text-dim bg-tag-bg px-2 py-0.5 rounded-full">
                    {industry.icon} {industry.name} / {category.name}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-text-bright">{app.name}</h4>
                <p className="text-[11px] text-text-dim mt-0.5">{app.company}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {app.platform.map((p) => (
                    <PlatformBadge key={p} platform={p} />
                  ))}
                </div>
              </div>
              <svg className="w-4 h-4 text-text-dim shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="text-center py-20">
      <svg className="w-16 h-16 text-text-placeholder mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h3 className="text-base font-semibold text-text-bright mb-2">データがありません</h3>
      <p className="text-sm text-text-dim">
        industries.json にデータを追加してください
      </p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */

export default function CompetitorUIView({ industries }: Props) {
  const [view, setView] = useState<ViewState>({ type: "landing" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchMode((prev) => !prev);
      }
      if (e.key === "Escape" && isSearchMode) {
        setIsSearchMode(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSearchMode]);

  const goHome = useCallback(() => {
    setView({ type: "landing" });
    setIsSearchMode(false);
    setSearchQuery("");
  }, []);

  const goIndustry = useCallback((industryId: string) => {
    setView({ type: "industry", industryId });
    setIsSearchMode(false);
    setSearchQuery("");
  }, []);

  const goApp = useCallback((industryId: string, appId: string) => {
    setView({ type: "app", industryId, appId });
    setIsSearchMode(false);
    setSearchQuery("");
  }, []);

  const currentIndustry = useMemo(() => {
    if (view.type === "industry" || view.type === "app") {
      return industries.find((i) => i.id === view.industryId);
    }
    return undefined;
  }, [industries, view]);

  const currentApp = useMemo(() => {
    if (view.type === "app" && currentIndustry) {
      for (const cat of currentIndustry.categories) {
        const app = cat.apps.find((a) => a.id === view.appId);
        if (app) return { app, category: cat };
      }
    }
    return undefined;
  }, [currentIndustry, view]);

  if (industries.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <button onClick={goHome} className="group flex items-center gap-2 cursor-pointer">
              <h1 className="text-xl font-bold text-text-bright group-hover:text-accent-blue transition-colors">
                Competitor UI Viewer
              </h1>
            </button>
            <p className="text-xs text-text-dim mt-1">業界別 競合アプリ UI/UX リサーチ</p>
          </div>
          <button
            onClick={() => setIsSearchMode(!isSearchMode)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-dim bg-bg-card border border-border-card rounded-lg hover:border-border-strong transition-colors cursor-pointer shadow-[var(--shadow-card)]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            検索
            <kbd className="hidden sm:inline text-[10px] text-text-placeholder bg-bg-section px-1.5 py-0.5 rounded border border-border-card">
              {"\u2318"}K
            </kbd>
          </button>
        </div>

        {isSearchMode && (
          <div className="mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="アプリ名、企業名、機能で検索..."
              autoFocus
            />
          </div>
        )}
      </header>

      {isSearchMode ? (
        <SearchResults
          industries={industries}
          query={searchQuery}
          onAppClick={goApp}
        />
      ) : view.type === "landing" ? (
        <div>
          <StatsBar industries={industries} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {industries.map((industry) => (
              <IndustryCard
                key={industry.id}
                industry={industry}
                onClick={() => goIndustry(industry.id)}
              />
            ))}
          </div>
        </div>
      ) : view.type === "industry" && currentIndustry ? (
        <div>
          <Breadcrumb
            items={[
              { label: "ホーム", onClick: goHome },
              { label: currentIndustry.name },
            ]}
          />
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{currentIndustry.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-text-bright">{currentIndustry.name}</h2>
              <p className="text-xs text-text-dim">{currentIndustry.nameEn}</p>
            </div>
          </div>
          <p className="text-sm text-text-dim mb-8 max-w-2xl">{currentIndustry.description}</p>

          {currentIndustry.categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onAppClick={(appId) => goApp(currentIndustry.id, appId)}
            />
          ))}
        </div>
      ) : view.type === "app" && currentIndustry && currentApp ? (
        <AppDetailView
          app={currentApp.app}
          industry={currentIndustry}
          category={currentApp.category}
          onBack={() => goIndustry(currentIndustry.id)}
          onGoHome={goHome}
          onGoIndustry={() => goIndustry(currentIndustry.id)}
        />
      ) : null}
    </div>
  );
}
