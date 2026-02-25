#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 分析結果からHTMLレポートを生成
 * @param {object} analysisResult - analyst.jsの出力
 * @param {object} options - 生成オプション
 * @returns {object} レポートパス情報
 */
function generate(analysisResult, options = {}) {
  const { outputDir, reportId, preset } = options;
  const { individual, comparison } = analysisResult;

  fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString();
  const id = reportId || `report-${Date.now()}`;

  // メインレポートHTML
  const html = generateReportHTML(individual, comparison, {
    reportId: id,
    timestamp,
    presetName: preset?.name || 'default',
  });

  const reportPath = path.join(outputDir, `${id}.html`);
  fs.writeFileSync(reportPath, html, 'utf8');

  // メタデータJSON（dashboardから参照用）
  const meta = {
    id,
    timestamp,
    preset: preset?.name || 'default',
    urls: individual.map((a) => a.url),
    viewports: [...new Set(individual.map((a) => a.viewport))],
    scores: individual
      .filter((a) => a.analysis?.overallScore)
      .map((a) => ({
        url: a.url,
        viewport: a.viewport,
        score: a.analysis.overallScore,
      })),
    comparison: comparison ? { winner: comparison.winner } : null,
    screenshotPaths: individual
      .filter((a) => a.screenshots)
      .map((a) => ({
        url: a.url,
        viewport: a.viewport,
        fold: a.screenshots.fold,
      })),
  };

  const metaPath = path.join(outputDir, `${id}.meta.json`);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');

  console.log(`  Report: ${reportPath}`);
  console.log(`  Meta:   ${metaPath}`);

  return { id, reportPath, metaPath, timestamp };
}

function generateReportHTML(analyses, comparison, info) {
  const { reportId, timestamp, presetName } = info;
  const date = new Date(timestamp);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const analysesHTML = analyses
    .map((a) => renderAnalysisSection(a))
    .join('\n');

  const comparisonHTML = comparison
    ? renderComparisonSection(comparison)
    : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Competitor UI Report — ${dateStr}</title>
<style>
:root {
  --bg: #0a0e1a;
  --bg-card: #111827;
  --bg-hover: #1e293b;
  --border: #1e293b;
  --text: #e2e8f0;
  --text-dim: #94a3b8;
  --text-bright: #f8fafc;
  --accent-blue: #3b82f6;
  --accent-violet: #8b5cf6;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
  --radius: 14px;
  --shadow: 0 4px 24px rgba(0,0,0,0.3);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, 'Helvetica Neue', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding: 40px 20px 60px;
  line-height: 1.6;
}
.container { max-width: 1100px; margin: 0 auto; }
h1 { text-align: center; font-size: 1.8rem; font-weight: 800; color: var(--text-bright); margin-bottom: 8px; }
.subtitle { text-align: center; font-size: 0.9rem; color: var(--text-dim); margin-bottom: 40px; }
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  margin-bottom: 24px;
}
.card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-bright);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-desktop { background: #1e3a5f; color: #60a5fa; }
.badge-mobile { background: #3b1f4e; color: #c084fc; }
.score-circle {
  width: 52px; height: 52px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}
.score-1 { background: var(--accent-rose); }
.score-2 { background: #e77c5a; }
.score-3 { background: var(--accent-amber); }
.score-4 { background: #6dd5a0; }
.score-5 { background: var(--accent-emerald); }
.summary-text { font-size: 0.95rem; color: var(--text); margin-bottom: 20px; }
.dim-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px; }
.dim-item {
  background: var(--bg-hover);
  border-radius: 10px;
  padding: 16px;
}
.dim-name { font-weight: 600; font-size: 0.88rem; color: var(--text-bright); margin-bottom: 6px; }
.dim-score-bar {
  height: 6px;
  border-radius: 3px;
  background: #1e293b;
  margin-bottom: 8px;
  overflow: hidden;
}
.dim-score-fill { height: 100%; border-radius: 3px; }
.fill-1 { background: var(--accent-rose); width: 20%; }
.fill-2 { background: #e77c5a; width: 40%; }
.fill-3 { background: var(--accent-amber); width: 60%; }
.fill-4 { background: #6dd5a0; width: 80%; }
.fill-5 { background: var(--accent-emerald); width: 100%; }
.dim-findings { font-size: 0.82rem; color: var(--text-dim); }
.list-section { margin-bottom: 16px; }
.list-section h3 { font-size: 0.9rem; font-weight: 600; color: var(--accent-blue); margin-bottom: 8px; }
.list-section ul { list-style: none; padding: 0; }
.list-section li {
  padding: 6px 0;
  font-size: 0.85rem;
  color: var(--text);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.list-section li::before { content: '-> '; color: var(--text-dim); }
.screenshot-container { margin: 20px 0; }
.screenshot-img {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: transform 0.2s;
}
.screenshot-img:hover { transform: scale(1.01); }
.screenshot-label { font-size: 0.78rem; color: var(--text-dim); margin-top: 6px; }
.comparison-card {
  background: linear-gradient(135deg, #111827 0%, #1a1f3a 100%);
  border: 1px solid var(--accent-violet);
}
.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.rank-num {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--accent-violet);
  width: 36px;
  text-align: center;
}
.rank-url { font-size: 0.88rem; color: var(--text-bright); font-weight: 600; }
.rank-reason { font-size: 0.8rem; color: var(--text-dim); }
.radar-container { display: flex; justify-content: center; margin: 20px 0; }
.footer { text-align: center; font-size: 0.78rem; color: var(--text-dim); margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); }
@media (max-width: 768px) {
  .dim-grid { grid-template-columns: 1fr; }
  body { padding: 20px 12px 40px; }
}
</style>
</head>
<body>
<div class="container">
  <h1>Competitor UI Report</h1>
  <p class="subtitle">${escHtml(dateStr)} | Preset: ${escHtml(presetName)} | ${analyses.length} pages analyzed</p>

  ${comparisonHTML}
  ${analysesHTML}

  <div class="footer">
    Generated by <strong>competitor-ui</strong> (Product Hub) on ${escHtml(timestamp)}<br>
    Report ID: ${escHtml(reportId)}
  </div>
</div>

<script>
// スクリーンショットクリックで拡大表示
document.querySelectorAll('.screenshot-img').forEach(img => {
  img.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer;padding:20px';
    const clone = img.cloneNode();
    clone.style.cssText = 'max-width:95vw;max-height:95vh;border-radius:8px;object-fit:contain';
    overlay.appendChild(clone);
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  });
});
</script>
</body>
</html>`;
}

function renderAnalysisSection(a) {
  const { url, viewport, metadata, screenshots, analysis = {} } = a;
  const score = analysis.overallScore || 0;
  const vpBadge = viewport === 'mobile' ? 'badge-mobile' : 'badge-desktop';
  const hasError = analysis.error;

  const dimensionsHTML = analysis.dimensions
    ? Object.entries(analysis.dimensions)
        .map(([key, dim]) => {
          const s = dim.score || 0;
          return `
          <div class="dim-item">
            <div class="dim-name">${escHtml(dim.name || key)} <span style="color:var(--text-dim);font-weight:400">${s}/5</span></div>
            <div class="dim-score-bar"><div class="dim-score-fill fill-${s}"></div></div>
            <div class="dim-findings">${escHtml(dim.findings || '')}</div>
          </div>`;
        })
        .join('')
    : '';

  const strengthsHTML =
    analysis.strengths?.length > 0
      ? `<div class="list-section"><h3>Strengths</h3><ul>${analysis.strengths.map((s) => `<li>${escHtml(s)}</li>`).join('')}</ul></div>`
      : '';

  const weaknessesHTML =
    analysis.weaknesses?.length > 0
      ? `<div class="list-section"><h3>Weaknesses</h3><ul>${analysis.weaknesses.map((s) => `<li>${escHtml(s)}</li>`).join('')}</ul></div>`
      : '';

  const patternsHTML =
    analysis.uniquePatterns?.length > 0
      ? `<div class="list-section"><h3>Unique Patterns</h3><ul>${analysis.uniquePatterns.map((s) => `<li>${escHtml(s)}</li>`).join('')}</ul></div>`
      : '';

  // スクリーンショットをBase64埋め込み
  let screenshotHTML = '';
  if (screenshots?.fold) {
    try {
      const imgData = fs.readFileSync(screenshots.fold).toString('base64');
      screenshotHTML = `
      <div class="screenshot-container">
        <img class="screenshot-img" src="data:image/png;base64,${imgData}" alt="Screenshot of ${escHtml(url)}">
        <div class="screenshot-label">First View — ${escHtml(viewport)}</div>
      </div>`;
    } catch {
      // スクリーンショット埋め込み失敗
    }
  }

  return `
  <div class="card">
    <div class="card-title">
      <div class="score-circle score-${score}">${score}</div>
      <div>
        <div>${escHtml(metadata.title || url)}</div>
        <div style="font-size:0.78rem;color:var(--text-dim);font-weight:400">${escHtml(url)} <span class="badge ${vpBadge}">${escHtml(viewport)}</span></div>
      </div>
    </div>
    ${hasError ? `<div class="summary-text" style="color:var(--accent-amber)">AI分析未実行 — スクリーンショットのみ</div>` : `<div class="summary-text">${escHtml(analysis.summary || '')}</div>`}
    ${screenshotHTML}
    ${dimensionsHTML ? `<div class="dim-grid">${dimensionsHTML}</div>` : ''}
    ${strengthsHTML}
    ${weaknessesHTML}
    ${patternsHTML}
  </div>`;
}

function renderComparisonSection(comparison) {
  if (!comparison || comparison.error) return '';

  const rankingHTML = (comparison.ranking || [])
    .map(
      (r, i) => `
    <div class="ranking-item">
      <div class="rank-num">#${i + 1}</div>
      <div>
        <div class="rank-url">${escHtml(r.url)} <span style="color:var(--accent-amber);font-weight:400">${r.score}/5</span></div>
        <div class="rank-reason">${escHtml(r.reason || '')}</div>
      </div>
    </div>`
    )
    .join('');

  const diffsHTML = (comparison.keyDifferences || [])
    .map((d) => `<li>${escHtml(d)}</li>`)
    .join('');

  const recsHTML = (comparison.recommendations || [])
    .map((r) => `<li>${escHtml(r)}</li>`)
    .join('');

  return `
  <div class="card comparison-card">
    <div class="card-title" style="color:var(--accent-violet)">Comparison Analysis</div>
    ${rankingHTML}
    ${diffsHTML ? `<div class="list-section" style="margin-top:16px"><h3>Key Differences</h3><ul>${diffsHTML}</ul></div>` : ''}
    ${recsHTML ? `<div class="list-section"><h3>Recommendations</h3><ul>${recsHTML}</ul></div>` : ''}
  </div>`;
}

module.exports = { generate };
