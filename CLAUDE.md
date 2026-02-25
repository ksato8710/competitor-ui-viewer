# CLAUDE.md

このファイルは Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドです。

## 概要

Competitor UI Viewer — 競合サイトのUI自動分析パイプラインとレポートビューアを統合した Next.js アプリ。分析パイプライン（スクリーンショット撮影・AI分析・レポート生成）が内蔵されており、外部リポジトリへの依存なしに単体で動作する。

## コマンド

- `pnpm dev` — 開発サーバー起動（Next.js）
- `pnpm build` — プロダクションビルド
- `pnpm analyze <url>` — 指定URLの競合UI分析を実行（スクリーンショット撮影 + AI分析 + レポート生成）
- `pnpm compare <url1> <url2> --compare` — 複数URLの比較分析を実行
- `pnpm scan` — `public/data/competitor-reports/` 内の `.meta.json` からインデックスを再構築

テストランナー・リンターは未設定。

### パイプライン詳細オプション

```bash
# 単一URL分析
pnpm analyze https://example.com

# 複数URL + モバイル対応
pnpm analyze https://a.com https://b.com -- --viewports desktop,mobile

# SaaS向けプリセット + 比較モード
pnpm compare https://a.com https://b.com -- --preset saas-landing
```

環境変数 `ANTHROPIC_API_KEY` が必要（AI分析用）。`COMPETITOR_DATA_DIR` でレポート出力先を変更可能（デフォルト: `public/data/competitor-reports/`）。

## アーキテクチャ

**分析パイプライン（`pipeline/`）:** 内蔵パイプラインがスクリーンショット撮影（Playwright）、Claude Vision によるUI分析、HTMLレポート生成を行う。レポートとメタデータは `public/data/competitor-reports/` に直接出力される。

```
pipeline/
├── index.js              # CLI エントリーポイント
├── agents/
│   ├── coordinator.js     # パイプライン全体のオーケストレーション
│   ├── crawler.js         # Playwright によるスクリーンショット撮影
│   ├── analyst.js         # Claude Vision API によるUI分析
│   └── reporter.js        # HTML レポート + メタデータ JSON 生成
└── presets/
    ├── default.json       # 汎用分析テンプレート
    └── saas-landing.json  # SaaS LP 特化テンプレート
```

**スキャン（`scripts/scan-reports.js`）:** ローカルの `public/data/competitor-reports/` をスキャンして `.meta.json` ファイルから `competitor-reports.json` インデックスを再構築するリインデクサー。外部リポジトリへの参照は持たない。

**レンダリング:** 単一ルート（`src/app/page.tsx`）の SPA。ページは Server Component で `competitor-reports.json` をディスクから読み込み（`fs.readFileSync`）、Client Component の `CompetitorUIView` にデータを渡す。

**主要コンポーネント:** `src/components/CompetitorUIView.tsx` — UI 全体がここに集約（レポートカード、検索・フィルター、スクリーンショットモーダル）。サブコンポーネント（`StatCard`、`ReportCard`、`ScreenshotPreview`、`EmptyState`）もすべて同ファイル内で定義。

**型定義:** `src/lib/types.ts` に `CompetitorReport`、`CompetitorScore`、`CompetitorThumbnail` を定義。

## スタイリング

- Tailwind CSS v4（`@tailwindcss/postcss` 経由）
- カスタムテーマトークンは `src/app/globals.css` の `@theme` で定義（例: `--color-bg-card`、`--color-text-bright`、`--color-accent-blue`）
- 生のカラー値ではなくセマンティックトークン（`bg-bg-card`、`text-text-dim`、`border-border`、`text-accent-blue` 等）を使うこと
- パスエイリアス: `@/*` → `./src/*`

## データ形式

JSON インデックスの各レポート: `id`、`timestamp`、`preset`、`urls[]`、`viewports[]`、`scores[]`（URL ごとのスコア 1-5）、`comparison`（任意、勝者）、`thumbnails[]`（`/data/competitor-reports/screenshots/{id}/` 配下のフォールドスクリーンショットパス）。

## データフロー

```
pnpm analyze <url>
  → pipeline/agents/crawler.js    (Playwright でスクリーンショット撮影)
  → pipeline/agents/analyst.js    (Claude Vision API で分析)
  → pipeline/agents/reporter.js   (HTML レポート + .meta.json 生成)
  → public/data/competitor-reports/  (レポート・スクリーンショット保存)

pnpm scan
  → scripts/scan-reports.js       (.meta.json → competitor-reports.json 再構築)

pnpm dev
  → src/app/page.tsx              (competitor-reports.json 読み込み)
  → CompetitorUIView.tsx          (レポート一覧表示)
```
