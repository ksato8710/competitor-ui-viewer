#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * マルチモーダルLLM (Claude) によるUI分析
 * @param {object[]} crawlResults - crawler.jsの出力
 * @param {object} options - 分析オプション
 * @returns {Promise<object>} 分析結果
 */
async function analyze(crawlResults, options = {}) {
  const { researchPreset, compareMode = false } = options;
  const analyses = [];

  const validResults = crawlResults.filter((r) => r.screenshots);
  if (validResults.length === 0) {
    console.log('  No valid screenshots to analyze');
    return { individual: [], comparison: null };
  }

  for (const result of validResults) {
    console.log(`  Analyzing ${result.url} [${result.viewport}]...`);

    const prompt = buildAnalysisPrompt(researchPreset, result.metadata);

    // ファーストビュー画像をメインに分析（API コスト最適化）
    const imageData = loadImageAsBase64(result.screenshots.fold);

    if (!imageData) {
      console.log(`  Skipping: image not found`);
      continue;
    }

    try {
      const response = await callClaudeVision(prompt, imageData);
      const analysis = parseAnalysisResponse(response);

      analyses.push({
        url: result.url,
        viewport: result.viewport,
        metadata: result.metadata,
        screenshots: result.screenshots,
        analysis,
      });

      console.log(`  Analysis complete: score ${analysis.overallScore || 'N/A'}`);
    } catch (err) {
      console.error(`  Analysis error for ${result.url}: ${err.message}`);
      analyses.push({
        url: result.url,
        viewport: result.viewport,
        metadata: result.metadata,
        screenshots: result.screenshots,
        analysis: { error: err.message },
      });
    }

    // APIレート制限対策
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 比較分析
  let comparison = null;
  if (compareMode && analyses.length >= 2) {
    comparison = await runComparison(analyses, researchPreset);
  }

  return { individual: analyses, comparison };
}

function loadImageAsBase64(filePath) {
  try {
    return fs.readFileSync(filePath).toString('base64');
  } catch {
    return null;
  }
}

function buildAnalysisPrompt(preset, metadata) {
  const dimensionText = preset.dimensions
    .map(
      (d) =>
        `### ${d.name} (weight: ${d.weight})\n${d.description}\n評価基準: ${d.criteria.join(', ')}`
    )
    .join('\n\n');

  return `あなたはUI/UXの専門家です。以下のWebサイトのスクリーンショットを分析してください。

## 分析対象
- URL: ${metadata.title ? `${metadata.title}` : '(不明)'}

## 分析観点
${dimensionText}

## 出力形式
以下のJSON形式で回答してください。JSONのみ出力し、他のテキストは含めないでください。

{
  "summary": "3行以内の全体要約",
  "overallScore": 1から5の数値（総合評価）,
  "dimensions": {
    "${preset.dimensions.map((d) => d.id).join('": {...},\n    "')}": {
      "score": 1から5の整数,
      "findings": "発見事項の自由記述（日本語）",
      "highlights": ["注目ポイント"]
    }
  },
  "strengths": ["強み（日本語）"],
  "weaknesses": ["改善機会（日本語）"],
  "uniquePatterns": ["他にはない独自のUIパターン（日本語）"]
}`;
}

function callClaudeVision(prompt, imageBase64) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return reject(new Error('ANTHROPIC_API_KEY not set'));
    }

    const body = JSON.stringify({
      model: process.env.COMPETITOR_UI_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              return reject(new Error(json.error.message || JSON.stringify(json.error)));
            }
            resolve(json.content?.[0]?.text || '');
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(body);
    req.end();
  });
}

function parseAnalysisResponse(text) {
  // JSON部分を抽出
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { raw: text, error: 'JSON parse failed' };
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { raw: text, error: 'JSON parse failed' };
  }
}

async function runComparison(analyses, preset) {
  const desktopAnalyses = analyses.filter((a) => a.viewport === 'desktop');
  if (desktopAnalyses.length < 2) return null;

  const summaries = desktopAnalyses
    .map(
      (a) =>
        `- ${a.url}: overall ${a.analysis.overallScore || '?'}/5, 強み: ${(a.analysis.strengths || []).join(', ')}, 弱み: ${(a.analysis.weaknesses || []).join(', ')}`
    )
    .join('\n');

  const prompt = `以下の複数サイトのUI分析結果を比較し、JSONで回答してください。

${summaries}

出力形式:
{
  "winner": "最も優れたUIのURL",
  "ranking": [{"url": "...", "score": 数値, "reason": "理由"}],
  "keyDifferences": ["主要な差異ポイント"],
  "recommendations": ["改善の推奨事項"]
}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await callClaudeText(prompt);
    return parseAnalysisResponse(response);
  } catch (err) {
    console.error(`  Comparison error: ${err.message}`);
    return null;
  }
}

function callClaudeText(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) return reject(new Error(json.error.message));
            resolve(json.content?.[0]?.text || '');
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(body);
    req.end();
  });
}

module.exports = { analyze };
