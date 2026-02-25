#!/usr/bin/env node
'use strict';

/**
 * Competitor Reports Re-indexer
 *
 * Scans local public/data/competitor-reports/ for .meta.json files
 * and rebuilds the competitor-reports.json index.
 *
 * Usage: node scripts/scan-reports.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'competitor-reports');
const INDEX_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'competitor-reports.json');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  console.log('=== Re-indexing Competitor Reports ===\n');
  console.log(`Reports dir: ${REPORTS_DIR}\n`);

  if (!fs.existsSync(REPORTS_DIR)) {
    console.log('No reports directory found.');
    ensureDir(path.dirname(INDEX_PATH));
    fs.writeFileSync(INDEX_PATH, '[]', 'utf8');
    return;
  }

  const metaFiles = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.meta.json'));
  console.log(`Found ${metaFiles.length} report(s)\n`);

  if (metaFiles.length === 0) {
    fs.writeFileSync(INDEX_PATH, '[]', 'utf8');
    console.log('No reports to index.');
    return;
  }

  const reports = [];

  for (const metaFile of metaFiles) {
    const metaPath = path.join(REPORTS_DIR, metaFile);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    // Build thumbnails from screenshotPaths
    const { screenshotPaths, ...cleanMeta } = meta;
    const thumbnails = [];

    if (Array.isArray(screenshotPaths)) {
      for (const sp of screenshotPaths) {
        if (sp.fold) {
          const fileName = path.basename(sp.fold);
          const expectedPath = path.join(REPORTS_DIR, 'screenshots', meta.id, fileName);
          if (fs.existsSync(expectedPath)) {
            thumbnails.push({
              url: sp.url,
              viewport: sp.viewport,
              foldPath: `/data/competitor-reports/screenshots/${meta.id}/${fileName}`,
            });
          }
        }
      }
    }

    if (thumbnails.length > 0) {
      cleanMeta.thumbnails = thumbnails;
    }
    reports.push(cleanMeta);
    console.log(`  Indexed: ${meta.id}`);
  }

  reports.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  fs.writeFileSync(INDEX_PATH, JSON.stringify(reports, null, 2), 'utf8');

  console.log(`\nIndex: ${INDEX_PATH}`);
  console.log(`Total: ${reports.length} report(s) indexed`);
}

main();
