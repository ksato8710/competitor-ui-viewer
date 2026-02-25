#!/usr/bin/env node
'use strict';

const { runAnalysis } = require('./agents/coordinator');

function printUsage() {
  console.log(`
Usage: node pipeline/index.js [options] <url1> [url2] ...

Options:
  --viewports <list>   Comma-separated viewports (default: desktop)
                       Available: desktop, mobile
  --preset <name>      Research preset name (default: default)
                       Available: default, saas-landing
  --compare            Enable comparison mode (requires 2+ URLs)
  --help               Show this help

Examples:
  # 単一URL分析
  node pipeline/index.js https://example.com

  # 複数URL + モバイル対応
  node pipeline/index.js https://a.com https://b.com --viewports desktop,mobile

  # SaaS向けプリセット + 比較モード
  node pipeline/index.js https://a.com https://b.com --preset saas-landing --compare
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  // 引数パース
  const urls = [];
  let viewports = ['desktop'];
  let preset = 'default';
  let compareMode = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--viewports' && args[i + 1]) {
      viewports = args[++i].split(',').map((v) => v.trim());
    } else if (arg === '--preset' && args[i + 1]) {
      preset = args[++i];
    } else if (arg === '--compare') {
      compareMode = true;
    } else if (arg.startsWith('http://') || arg.startsWith('https://')) {
      urls.push(arg);
    } else if (!arg.startsWith('--')) {
      // httpsなしの場合は自動補完
      urls.push(`https://${arg}`);
    }
  }

  if (urls.length === 0) {
    console.error('Error: At least one URL is required');
    printUsage();
    process.exit(1);
  }

  if (compareMode && urls.length < 2) {
    console.error('Error: --compare requires at least 2 URLs');
    process.exit(1);
  }

  try {
    await runAnalysis(urls, { viewports, preset, compareMode });
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

main();
