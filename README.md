# Competitor UI Viewer

**競合サイトの UI を自動分析し、定量的に比較するパイプライン付きレポートビューア**

[![Deploy](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://competitor-ui-viewer.craftgarden.studio)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-2EAD33?logo=playwright)](https://playwright.dev/)

> **Live**: [competitor-ui-viewer.craftgarden.studio](https://competitor-ui-viewer.craftgarden.studio)

![Competitor UI Viewer Screenshot](screenshot.png)

---

## 概要

プロダクト開発において競合サイトの UI/UX 調査は重要ですが、手動でのスクリーンショット取得・分析は時間がかかります。Competitor UI Viewer は **Playwright + Claude Vision API** のパイプラインでこのプロセスを完全自動化し、定期的な競合 UI ウォッチを実現します。

分析パイプライン（スクリーンショット撮影・AI分析・レポート生成）が内蔵されており、外部リポジトリへの依存なしに単体で動作します。

- **自動スクリーンショット取得** -- Playwright でヘッドレスブラウザを操作し、競合サイトのスクリーンショットを自動キャプチャ
- **AI UI 分析** -- Claude Vision API で UI デザイン、レイアウト、配色、タイポグラフィを定量スコアリング
- **HTML レポート生成** -- 分析結果をビジュアルな HTML レポートとして出力
- **サイド・バイ・サイド比較** -- 2 つの URL を並べて UI を比較分析
- **MCP サーバー** -- Model Context Protocol サーバーとして Claude Code から直接実行可能
- **プリセット管理** -- SaaS LP、EC サイトなどカテゴリ別分析テンプレート
- **レポートビューア** -- 生成済みレポートの一覧・閲覧ダッシュボード（Next.js）

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript, JavaScript |
| Crawler | Playwright (Chromium) |
| AI Analysis | Claude Vision API (Anthropic) |
| DB | Turso (libSQL) |
| Validation | Zod |
| MCP | @modelcontextprotocol/sdk |
| Deploy | Vercel |

## セットアップ

### 前提条件

- Node.js >= 20
- pnpm
- Playwright ブラウザ（初回インストール必要）
- Anthropic API キー（Claude Vision 分析用）

### インストール

```bash
git clone https://github.com/ksato8710/competitor-ui-viewer.git
cd competitor-ui-viewer
pnpm install

# Playwright ブラウザをインストール
npx playwright install chromium
```

### 環境変数

`.env.local` を作成し、以下を設定:

```env
# Claude Vision API（必須）
ANTHROPIC_API_KEY=sk-ant-xxxxx

# レポート出力先（オプション、デフォルト: public/data/competitor-reports/）
COMPETITOR_DATA_DIR=public/data/competitor-reports/
```

### 起動

```bash
# 開発サーバー起動（レポートビューア）
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## アーキテクチャ

### ディレクトリ構成

```
competitor-ui-viewer/
├── src/
│   ├── app/
│   │   ├── page.tsx               # レポートビューア・ダッシュボード
│   │   ├── layout.tsx             # ルートレイアウト
│   │   └── globals.css            # グローバルスタイル + テーマトークン
│   ├── components/
│   │   └── CompetitorUIView.tsx   # メイン UI（カード・検索・フィルタ・モーダル）
│   └── lib/
│       └── types.ts               # CompetitorReport, CompetitorScore 型定義
├── pipeline/
│   ├── index.js                   # CLI エントリーポイント
│   ├── agents/
│   │   ├── coordinator.js         # パイプライン全体のオーケストレーション
│   │   ├── crawler.js             # Playwright スクリーンショット撮影
│   │   ├── analyst.js             # Claude Vision API 分析
│   │   └── reporter.js            # HTML レポート + .meta.json 生成
│   └── presets/
│       ├── default.json           # 汎用分析テンプレート
│       └── saas-landing.json      # SaaS LP 特化テンプレート
├── mcp/
│   ├── server.ts                  # MCP サーバーエントリ
│   └── schemas/                   # Zod バリデーションスキーマ
├── scripts/
│   └── scan-reports.js            # .meta.json からインデックス再構築
├── public/data/
│   └── competitor-reports/        # 生成レポート保存先
├── package.json
└── tsconfig.json
```

### パイプラインフロー

```
URL 入力
    │
    ▼
Playwright (Chromium) -- スクリーンショット取得
    │
    ▼
Claude Vision API -- UI 要素・レイアウト・配色分析
    │
    ▼
HTML レポート + .meta.json 生成
    │
    ▼
public/data/competitor-reports/
    │
    ▼
pnpm scan -- インデックス再構築
    │
    ▼
レポートビューア（Next.js ダッシュボード）
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動（レポートビューア） |
| `pnpm build` | プロダクションビルド |
| `pnpm start` | プロダクションサーバー起動 |
| `pnpm analyze <url>` | 指定 URL の UI 分析を実行 |
| `pnpm compare <url1> <url2>` | 2 つの URL のサイド・バイ・サイド比較 |
| `pnpm scan` | 生成済みレポートのインデックス再構築 |
| `pnpm mcp:start` | MCP サーバー起動 |

### 使用例

```bash
# 単一サイトの分析
pnpm analyze https://example.com

# 複数 URL + モバイル対応
pnpm analyze https://a.com https://b.com -- --viewports desktop,mobile

# SaaS 向けプリセット + 比較モード
pnpm compare https://a.com https://b.com -- --preset saas-landing
```

## デプロイ

Vercel にデプロイ済み。`master` ブランチへの push で自動デプロイが実行されます。

- **本番 URL**: https://competitor-ui-viewer.craftgarden.studio
- **ブランチ**: `master`
- **サブドメイン管理**: Vercel + AWS Route 53

Playwright による動的キャプチャはローカル実行が前提です。Vercel 上ではレポートビューアのみが動作します。

## テスト

テストフレームワークは未設定です。手動でのパイプライン実行確認が主な検証方法です。

```bash
# パイプライン動作確認
pnpm analyze https://example.com
pnpm scan
pnpm dev
```

## 関連プロジェクト

[craftgarden.studio](https://craftgarden.studio) エコシステムの一部として、他プロジェクトと連携しています。

| プロジェクト | 説明 |
|-------------|------|
| [product-hub](https://github.com/ksato8710/product-hub) | プロダクトエコシステム管理ダッシュボード |
| [craftgarden-studio](https://github.com/ksato8710/craftgarden-studio) | コーポレートサイト |
| [feedback-hub](https://github.com/ksato8710/feedback-hub) | フィードバック収集・分析 |

## 開発ガイド

- **スタイリング**: Tailwind CSS v4 のセマンティックトークン（`bg-bg-card`, `text-text-dim` 等）を使用
- **パスエイリアス**: `@/*` -> `./src/*`
- **コンポーネント**: `CompetitorUIView.tsx` に UI が集約（StatCard, ReportCard, ScreenshotPreview, EmptyState）
- Issue や Pull Request は歓迎です。パイプライン実行にはローカルに Playwright と Claude API キーが必要です

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-02 | MCP サーバー対応追加、プリセット機能 |
| 2026-01 | サイド・バイ・サイド比較機能追加 |
| 2025-12 | 初期リリース -- Playwright キャプチャ + Claude Vision 分析パイプライン |

## ロードマップ

- [ ] 定期スキャンの自動化（cron / GitHub Actions）
- [ ] UI 変更差分の自動検出・通知
- [ ] 分析レポートの PDF エクスポート
- [ ] 複数ページ一括クロール対応
- [ ] 分析結果の DB 保存・時系列追跡

## ライセンス

MIT
