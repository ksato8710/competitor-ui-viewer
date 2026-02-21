# CLAUDE.md

このファイルは Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドです。

## 概要

Competitor UI Viewer — 競合サイトのUI自動分析レポートを表示する Next.js アプリ。レポートは外部の `product-hub/packages/competitor-ui` で生成され、スキャンスクリプトでこのビューアに同期される。

## コマンド

- `pnpm dev` — 開発サーバー起動（Next.js）
- `pnpm build` — プロダクションビルド
- `pnpm scan` — 隣接する `product-hub` リポジトリからレポートを `public/data/` に同期

テストランナー・リンターは未設定。

## アーキテクチャ

**データパイプライン:** レポートは外部で生成される（`../product-hub/packages/competitor-ui/data/reports/`）。`scripts/scan-reports.js` が HTML レポートとフォールドスクリーンショットを `public/data/competitor-reports/` にコピーし、`public/data/competitor-reports.json` インデックスファイルを生成する。

**レンダリング:** 単一ルート（`src/app/page.tsx`）の SPA。ページは Server Component で `competitor-reports.json` をディスクから読み込み（`fs.readFileSync`）、Client Component の `CompetitorUIView` にデータを渡す。

**主要コンポーネント:** `src/components/CompetitorUIView.tsx` — UI 全体がここに集約（レポートカード、検索・フィルター、スクリーンショットモーダル）。サブコンポーネント（`StatCard`、`ReportCard`、`ScreenshotPreview`、`EmptyState`）もすべて同ファイル内で定義。

**型定義:** `src/lib/types.ts` に `CompetitorReport`、`CompetitorScore`、`CompetitorThumbnail` を定義。

## スタイリング

- Tailwind CSS v4（`@tailwindcss/postcss` 経由）
- カスタムテーマトークンは `src/app/globals.css` の `@theme` で定義（例: `--color-bg-card`、`--color-text-bright`、`--color-accent-blue`）
- 生のカラー値ではなくセマンティックトークン（`bg-bg-card`、`text-text-dim`、`border-border`、`text-accent-blue` 等）を使うこと
- パスエイリアス: `@/*` → `./src/*`

## データ形式

JSON インデックスの各レポート: `id`、`timestamp`、`preset`、`urls[]`、`viewports[]`、`scores[]`（URL ごとのスコア 1-5）、`comparison`（任意、勝者）、`thumbnails[]`（`/data/competitor-reports/{id}/` 配下のフォールドスクリーンショットパス）。
