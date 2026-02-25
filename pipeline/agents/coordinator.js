#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { capture } = require('./crawler');
const { analyze } = require('./analyst');
const { generate } = require('./reporter');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = process.env.COMPETITOR_DATA_DIR
  || path.join(PROJECT_ROOT, 'public', 'data', 'competitor-reports');
const PRESETS_DIR = path.resolve(__dirname, '..', 'presets');

const pipeline = {
  startPipelineRun: (name, meta) => ({ pipeline: name, startMs: Date.now(), ...meta }),
  finishPipelineRun: () => {},
};

function loadPreset(presetName) {
  const presetPath = path.join(PRESETS_DIR, `${presetName}.json`);
  if (!fs.existsSync(presetPath)) {
    console.log(`  Preset '${presetName}' not found, falling back to 'default'`);
    return loadPreset('default');
  }

  const preset = JSON.parse(fs.readFileSync(presetPath, 'utf8'));

  // extends対応
  if (preset.extends) {
    const base = loadPreset(preset.extends);
    return {
      ...base,
      ...preset,
      dimensions: [
        ...base.dimensions,
        ...(preset.extra_dimensions || []),
      ],
    };
  }

  return preset;
}

/**
 * 分析パイプライン実行
 * @param {string[]} urls - 分析対象URL
 * @param {object} options - オプション
 */
async function runAnalysis(urls, options = {}) {
  const {
    viewports = ['desktop'],
    preset: presetName = 'default',
    compareMode = false,
  } = options;

  const run = pipeline.startPipelineRun('competitor-ui-analysis', {
    urls,
    viewports,
    preset: presetName,
  });

  const reportId = `report-${Date.now()}`;
  const screenshotDir = path.join(DATA_DIR, 'screenshots', reportId);
  const reportDir = DATA_DIR;  // reports go directly to DATA_DIR

  try {
    console.log('\n=== Competitor UI Analysis ===');
    console.log(`URLs: ${urls.join(', ')}`);
    console.log(`Viewports: ${viewports.join(', ')}`);
    console.log(`Preset: ${presetName}`);
    console.log('');

    // 1. リサーチ観点テンプレート読み込み
    console.log('[1/3] Loading research preset...');
    const preset = loadPreset(presetName);
    console.log(`  Loaded: ${preset.name} v${preset.version} (${preset.dimensions.length} dimensions)`);

    // 2. スクリーンショット撮影
    console.log('\n[2/3] Capturing screenshots...');
    const crawlResults = await capture(urls, {
      viewports,
      outputDir: screenshotDir,
    });

    const successCount = crawlResults.filter((r) => r.screenshots).length;
    console.log(`  Captured: ${successCount}/${crawlResults.length} pages`);

    if (successCount === 0) {
      throw new Error('No screenshots captured successfully');
    }

    // 3. AI分析
    console.log('\n[3/3] Running AI analysis...');
    const analysisResult = await analyze(crawlResults, {
      researchPreset: preset,
      compareMode,
    });

    // 4. レポート生成
    console.log('\nGenerating report...');
    const report = generate(analysisResult, {
      outputDir: reportDir,
      reportId,
      preset,
    });

    // 5. レポートインデックス更新
    updateReportIndex(report, reportDir);

    pipeline.finishPipelineRun(run, 'success', {
      reportId: report.id,
      reportPath: report.reportPath,
      analyzedUrls: urls.length,
    });

    console.log('\n=== Analysis Complete ===');
    console.log(`Report: ${report.reportPath}`);
    console.log(`Open: file://${report.reportPath}`);

    return report;
  } catch (err) {
    pipeline.finishPipelineRun(run, 'failure', { error: err.message });
    console.error(`\nAnalysis failed: ${err.message}`);
    throw err;
  }
}

/** レポートインデックスを更新（dashboard用） */
function updateReportIndex(report, reportDir) {
  const indexPath = path.join(reportDir, 'index.json');
  let index = [];

  try {
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
  } catch {
    index = [];
  }

  // メタデータを読み込み
  try {
    const meta = JSON.parse(fs.readFileSync(report.metaPath, 'utf8'));
    index.unshift(meta);
  } catch {
    // メタデータがなければ最小限の情報を追加
    index.unshift({ id: report.id, timestamp: report.timestamp });
  }

  // 最新50件のみ保持
  index = index.slice(0, 50);

  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
}

module.exports = { runAnalysis, loadPreset };
