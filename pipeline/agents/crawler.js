#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VIEWPORT_PRESETS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 812 },
};

const BLOCK_PATTERNS = [
  '*.doubleclick.net*',
  '*.google-analytics.com*',
  '*.googletagmanager.com*',
  '*.facebook.net*',
  '*.hotjar.com*',
];

function slugify(url) {
  return url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * 指定URLのスクリーンショットを撮影
 * @param {string[]} urls - 撮影対象URL
 * @param {object} options - 撮影オプション
 * @returns {Promise<object[]>} 撮影結果
 */
async function capture(urls, options = {}) {
  const {
    viewports = ['desktop'],
    outputDir,
    blockAds = true,
    waitMs = 2000,
  } = options;

  ensureDir(outputDir);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const url of urls) {
    const slug = slugify(url);

    for (const vpName of viewports) {
      const vp = VIEWPORT_PRESETS[vpName] || VIEWPORT_PRESETS.desktop;

      const context = await browser.newContext({
        viewport: vp,
        locale: 'ja-JP',
        userAgent: undefined, // デフォルトUA
      });

      const page = await context.newPage();

      // 広告・トラッカーブロック
      if (blockAds) {
        await page.route('**/*', (route) => {
          const reqUrl = route.request().url();
          const shouldBlock = BLOCK_PATTERNS.some((pattern) => {
            const domain = pattern.replace(/\*/g, '');
            return reqUrl.includes(domain);
          });
          return shouldBlock ? route.abort() : route.continue();
        });
      }

      try {
        console.log(`  Capturing ${url} [${vpName}]...`);
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        } catch {
          // networkidle タイムアウト時は domcontentloaded にフォールバック
          console.log(`  Retrying with domcontentloaded...`);
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(3000); // JS描画の待機
        }

        // Cookie同意バナーを閉じる試み
        await dismissCookieBanner(page);

        // 追加待機（動的コンテンツの読み込み）
        await page.waitForTimeout(waitMs);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const prefix = `${slug}__${vpName}__${timestamp}`;

        // フルページスクリーンショット
        const fullPath = path.join(outputDir, `${prefix}__full.png`);
        await page.screenshot({ path: fullPath, fullPage: true });

        // ファーストビュー
        const foldPath = path.join(outputDir, `${prefix}__fold.png`);
        await page.screenshot({ path: foldPath, fullPage: false });

        const title = await page.title();
        const description = await page.$eval(
          'meta[name="description"]',
          (el) => el.getAttribute('content') || ''
        ).catch(() => '');

        results.push({
          url,
          viewport: vpName,
          screenshots: {
            full: fullPath,
            fold: foldPath,
          },
          metadata: {
            title,
            description,
            timestamp: new Date().toISOString(),
            viewportSize: vp,
          },
        });

        console.log(`  Done: ${title}`);
      } catch (err) {
        console.error(`  Error capturing ${url} [${vpName}]: ${err.message}`);
        results.push({
          url,
          viewport: vpName,
          screenshots: null,
          metadata: { error: err.message, timestamp: new Date().toISOString() },
        });
      }

      await context.close();

      // レート制限: 同一ドメインへの連続アクセスを避ける
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  await browser.close();
  return results;
}

/** Cookie同意バナーを自動で閉じる */
async function dismissCookieBanner(page) {
  const selectors = [
    '[id*="cookie"] button',
    '[class*="cookie"] button',
    '[id*="consent"] button',
    '[class*="consent"] button',
    'button:has-text("Accept")',
    'button:has-text("OK")',
    'button:has-text("同意")',
    'button:has-text("承認")',
  ];

  for (const sel of selectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(500);
        return;
      }
    } catch {
      // 無視
    }
  }
}

module.exports = { capture, VIEWPORT_PRESETS };
