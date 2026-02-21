#!/usr/bin/env node
'use strict';

/**
 * Competitor UI レポートスキャナー
 *
 * product-hub/packages/competitor-ui が生成したレポートを
 * このプロジェクトの public/data/ にコピーし、index JSON を生成する。
 *
 * Usage: node scripts/scan-reports.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(
  PROJECT_ROOT, '..', 'product-hub', 'packages', 'competitor-ui', 'data', 'reports'
);
const SCREENSHOTS_SRC = path.join(
  PROJECT_ROOT, '..', 'product-hub', 'packages', 'competitor-ui', 'data', 'screenshots'
);
const DEST_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'competitor-reports');
const INDEX_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'competitor-reports.json');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  console.log('=== Scanning Competitor UI Reports ===\n');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Dest:   ${DEST_DIR}\n`);

  // ソースディレクトリが存在しない場合
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log('No reports found. Run `pnpm competitor:analyze` in product-hub first.');
    ensureDir(path.dirname(INDEX_PATH));
    fs.writeFileSync(INDEX_PATH, '[]', 'utf8');
    console.log(`Empty index written: ${INDEX_PATH}`);
    return;
  }

  // .meta.json ファイルを収集
  const metaFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.meta.json'));
  console.log(`Found ${metaFiles.length} report(s)\n`);

  if (metaFiles.length === 0) {
    ensureDir(path.dirname(INDEX_PATH));
    fs.writeFileSync(INDEX_PATH, '[]', 'utf8');
    console.log('No reports to sync.');
    return;
  }

  ensureDir(DEST_DIR);

  const reports = [];

  for (const metaFile of metaFiles) {
    const metaPath = path.join(SOURCE_DIR, metaFile);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    // HTMLレポートをコピー
    const htmlFile = metaFile.replace('.meta.json', '.html');
    const htmlSrc = path.join(SOURCE_DIR, htmlFile);
    const htmlDest = path.join(DEST_DIR, htmlFile);

    if (fs.existsSync(htmlSrc)) {
      fs.copyFileSync(htmlSrc, htmlDest);
      console.log(`  Copied: ${htmlFile}`);
    }

    // fold スクリーンショットをコピーして thumbnails 配列を構築
    const { screenshotPaths, ...cleanMeta } = meta;
    const thumbnails = [];

    if (Array.isArray(screenshotPaths)) {
      const reportImgDir = path.join(DEST_DIR, meta.id);
      ensureDir(reportImgDir);

      for (const sp of screenshotPaths) {
        if (sp.fold && fs.existsSync(sp.fold)) {
          const fileName = path.basename(sp.fold);
          const imgDest = path.join(reportImgDir, fileName);
          fs.copyFileSync(sp.fold, imgDest);
          thumbnails.push({
            url: sp.url,
            viewport: sp.viewport,
            foldPath: `/data/competitor-reports/${meta.id}/${fileName}`,
          });
          console.log(`  Screenshot: ${fileName}`);
        }
      }
    }

    if (thumbnails.length > 0) {
      cleanMeta.thumbnails = thumbnails;
    }
    reports.push(cleanMeta);
  }

  // タイムスタンプ降順でソート
  reports.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  // インデックス JSON 出力
  fs.writeFileSync(INDEX_PATH, JSON.stringify(reports, null, 2), 'utf8');

  console.log(`\nIndex: ${INDEX_PATH}`);
  console.log(`Reports dir: ${DEST_DIR}`);
  console.log(`Total: ${reports.length} report(s) synced`);
}

main();
