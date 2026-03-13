/**
 * Report Section Definitions for App Inspector Reports
 *
 * These section definitions are the canonical schema for structured app analysis.
 * Both the App Inspector (analysis/generation) and the Competitor UI Viewer (display)
 * use these definitions to ensure consistent, high-quality report data.
 */

// ─── Section Data Types ─────────────────────────────────────────────────────

export interface ReportAppOverview {
  description: string;
  targetUsers: string;
  appCategory: string;
}

export interface ReportFeature {
  name: string;
  description: string;
  screens: string[];
  importance: 'core' | 'secondary' | 'utility';
}

export interface ReportFeatureCategory {
  category: string;
  features: ReportFeature[];
}

export interface ReportKeyFlow {
  name: string;
  steps: string[];
}

export interface ReportAppStructure {
  navigationPattern: string;
  informationArchitecture: string;
  keyFlows: ReportKeyFlow[];
}

export interface ReportScreen {
  screenId: string;
  label: string;
  screenType: 'home' | 'list' | 'detail' | 'form' | 'settings' | 'menu' | 'notification' | 'search' | 'external' | 'unknown';
  description: string;
  features: string[];
}

export interface ReportScreenTransition {
  from: string;
  to: string;
  trigger: string;
  description: string;
}

export interface ReportScreenDesign {
  screens: ReportScreen[];
  transitions: ReportScreenTransition[];
}

export interface ReportIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  affectedScreens: string[];
}

// ─── Full Report Type ───────────────────────────────────────────────────────

export interface AppInspectionReport {
  summary: string;
  appOverview: ReportAppOverview;
  featureAnalysis: ReportFeatureCategory[];
  appStructure: ReportAppStructure;
  screenDesign: ReportScreenDesign;
  uxCharacteristics: string[];
  issues: ReportIssue[];
  competitiveAnalysis: string[];
  generatedAt: string;
}

// ─── Section Definitions ────────────────────────────────────────────────────

export interface ReportSectionDef {
  key: string;
  label: string;
  labelEn: string;
  icon: string;
  description: string;
}

export const REPORT_SECTIONS: ReportSectionDef[] = [
  {
    key: 'summary',
    label: '総合サマリー',
    labelEn: 'Executive Summary',
    icon: '📋',
    description: 'アプリの全体像・主要な知見・ポジショニングを凝縮した概要',
  },
  {
    key: 'app_overview',
    label: 'アプリ概要',
    labelEn: 'App Overview',
    icon: '📱',
    description: 'アプリの説明、対象ユーザー、カテゴリ分類',
  },
  {
    key: 'feature_analysis',
    label: '機能分析',
    labelEn: 'Feature Analysis',
    icon: '🔍',
    description: 'カテゴリ別の機能一覧。各機能の重要度（core/secondary/utility）と対応画面を含む',
  },
  {
    key: 'app_structure',
    label: 'アプリ構造',
    labelEn: 'App Structure',
    icon: '🏗️',
    description: 'ナビゲーションパターン、情報設計、主要ユーザーフロー',
  },
  {
    key: 'screen_design',
    label: '画面設計',
    labelEn: 'Screen Design',
    icon: '🗺️',
    description: '各画面の役割・機能一覧と画面間の遷移フロー',
  },
  {
    key: 'ux_characteristics',
    label: 'UX特性・強み',
    labelEn: 'UX Characteristics',
    icon: '⭐',
    description: 'UI/UXの特長、設計品質の評価、独自の工夫',
  },
  {
    key: 'issues',
    label: '課題・改善点',
    labelEn: 'Issues & Improvements',
    icon: '⚠️',
    description: '発見された問題点と重要度（critical/major/minor）別の改善提案',
  },
  {
    key: 'competitive_analysis',
    label: '競合ポジショニング',
    labelEn: 'Competitive Analysis',
    icon: '🏆',
    description: '競合アプリとの比較分析、差別化ポイント、市場でのポジション',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert raw App Inspector report JSON to the canonical AppInspectionReport format */
export function normalizeReport(raw: Record<string, unknown>): AppInspectionReport {
  const r = raw as Record<string, unknown>;
  const appOverview = (r.appOverview || {}) as Record<string, string>;
  const appStructure = (r.appStructure || {}) as Record<string, unknown>;

  return {
    summary: String(r.summary || ''),
    appOverview: {
      description: String(appOverview.description || ''),
      targetUsers: String(appOverview.targetUsers || ''),
      appCategory: String(appOverview.appCategory || ''),
    },
    featureAnalysis: Array.isArray(r.featureAnalysis) ? r.featureAnalysis : [],
    appStructure: {
      navigationPattern: String(appStructure.navigationPattern || ''),
      informationArchitecture: String(appStructure.informationArchitecture || ''),
      keyFlows: Array.isArray(appStructure.keyFlows) ? appStructure.keyFlows : [],
    },
    screenDesign: {
      screens: Array.isArray(r.screenMap) ? r.screenMap : [],
      transitions: Array.isArray(r.screenTransitions) ? r.screenTransitions : [],
    },
    uxCharacteristics: Array.isArray(r.characteristics) ? r.characteristics.map(String) : [],
    issues: Array.isArray(r.issues) ? r.issues : [],
    competitiveAnalysis: Array.isArray(r.competitorInsights) ? r.competitorInsights.map(String) : [],
    generatedAt: String(r.generatedAt || new Date().toISOString()),
  };
}
