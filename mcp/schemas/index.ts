import { z } from 'zod';

export const CompetitorCategorySchema = z.enum([
  'quiz-app',
  'news-media',
  'saas',
  'content',
  'other',
]);

export const FindingTypeSchema = z.enum([
  'ui_pattern',
  'feature',
  'pricing',
  'technology',
  'content_strategy',
  'ux_flow',
  'seo',
]);

export const ImpactSchema = z.enum(['high', 'medium', 'low']);

export const RegisterCompetitorSchema = z.object({
  name: z.string().min(1).max(200).describe('競合サービス名'),
  url: z.url().describe('メインURL'),
  description: z.string().optional().describe('サービス概要'),
  category: CompetitorCategorySchema.optional().describe('カテゴリ'),
  target_audience: z.string().optional().describe('ターゲット層'),
  our_project: z.string().optional().describe('競合する自社プロジェクト名'),
  strengths: z.string().optional().describe('強み'),
  weaknesses: z.string().optional().describe('弱み'),
  notes: z.string().optional().describe('メモ'),
});

export const ListCompetitorsSchema = z.object({
  category: CompetitorCategorySchema.optional().describe('カテゴリでフィルタ'),
  our_project: z.string().optional().describe('自社プロジェクト名でフィルタ'),
  limit: z.number().min(1).max(50).default(20).describe('取得件数上限'),
});

export const GetCompetitorSchema = z
  .object({
    id: z.string().optional().describe('競合ID'),
    name: z.string().optional().describe('競合名で検索'),
  })
  .refine((value) => Boolean(value.id || value.name), {
    message: 'id または name のいずれかを指定してください',
  });

export const AddFindingSchema = z.object({
  competitor_id: z.string().min(1).describe('競合ID'),
  type: FindingTypeSchema.describe('発見事項の種別'),
  title: z.string().min(1).max(200).describe('タイトル'),
  description: z.string().optional().describe('詳細説明'),
  source_url: z.url().optional().describe('発見元のURL'),
  impact: ImpactSchema.optional().describe('インパクト'),
  actionable: z.boolean().default(false).describe('自社に取り入れるべきか'),
});

export const SearchFindingsSchema = z.object({
  keyword: z.string().optional().describe('キーワード検索（タイトル・説明にマッチ）'),
  type: FindingTypeSchema.optional().describe('種別でフィルタ'),
  our_project: z.string().optional().describe('自社プロジェクト名でフィルタ（competitors経由）'),
  actionable_only: z.boolean().optional().describe('actionable=trueのみ取得'),
  limit: z.number().min(1).max(50).default(20).describe('取得件数上限'),
});

export const UpdateFindingSchema = z
  .object({
    id: z.string().min(1).describe('発見事項ID'),
    action_taken: z.string().optional().describe('実施したアクション'),
    actionable: z.boolean().optional().describe('actionableフラグ更新'),
    impact: ImpactSchema.optional().describe('インパクト更新'),
  })
  .refine(
    (value) =>
      value.action_taken !== undefined ||
      value.actionable !== undefined ||
      value.impact !== undefined,
    {
      message:
        'action_taken / actionable / impact のいずれかを指定してください',
    },
  );

export const RegisterAppInspectionSchema = z.object({
  app_package: z.string().min(1).describe('アプリパッケージ名 (例: jp.saitama.minnaapp)'),
  app_name: z.string().min(1).describe('アプリ表示名'),
  platform: z.enum(['Android', 'iOS', 'Web']).default('Android').describe('プラットフォーム'),
  description: z.string().optional().describe('アプリ概要'),
  target_users: z.string().optional().describe('ターゲットユーザー'),
  app_category: z.string().optional().describe('アプリカテゴリ'),
  navigation_pattern: z.string().optional().describe('ナビゲーションパターン'),
  information_architecture: z.string().optional().describe('情報設計'),
  characteristics: z.array(z.string()).optional().describe('アプリの特徴'),
  competitor_insights: z.array(z.string()).optional().describe('競合インサイト'),
  ux_insights: z.array(z.string()).optional().describe('UXインサイト'),
  issues: z.array(z.object({
    severity: z.enum(['critical', 'major', 'minor']),
    category: z.string(),
    description: z.string(),
    affectedScreens: z.array(z.string()).optional(),
  })).optional().describe('発見された課題'),
  feature_analysis: z.array(z.object({
    category: z.string(),
    features: z.array(z.object({
      name: z.string(),
      description: z.string(),
      screens: z.array(z.string()).optional(),
      importance: z.enum(['core', 'secondary', 'utility']).optional(),
    })),
  })).optional().describe('機能分析'),
  screen_transitions: z.array(z.object({
    from: z.string(),
    to: z.string(),
    trigger: z.string(),
    description: z.string().optional(),
  })).optional().describe('画面遷移'),
  key_flows: z.array(z.object({
    name: z.string(),
    steps: z.array(z.string()),
  })).optional().describe('主要フロー'),
  summary: z.string().optional().describe('全体サマリー'),
  source_session_id: z.string().optional().describe('App InspectorセッションID'),
});

export const AddInspectionScreenSchema = z.object({
  inspection_id: z.string().min(1).describe('インスペクションID'),
  label: z.string().min(1).describe('画面名'),
  screen_type: z.string().optional().describe('画面種別 (home, list, detail, form, settings, etc.)'),
  description: z.string().optional().describe('画面の説明'),
  features: z.array(z.string()).optional().describe('この画面の機能'),
  screenshot_url: z.string().optional().describe('スクリーンショットURL'),
  sort_order: z.number().optional().describe('表示順'),
});

export const ListAppInspectionsSchema = z.object({
  platform: z.enum(['Android', 'iOS', 'Web']).optional().describe('プラットフォームでフィルタ'),
  limit: z.number().min(1).max(50).default(20).describe('取得件数上限'),
});

export const GetAppInspectionSchema = z.object({
  id: z.string().optional().describe('インスペクションID'),
  app_package: z.string().optional().describe('パッケージ名で検索'),
}).refine((v) => Boolean(v.id || v.app_package), {
  message: 'id または app_package のいずれかを指定してください',
});

export type RegisterCompetitorInput = z.infer<typeof RegisterCompetitorSchema>;
export type ListCompetitorsInput = z.infer<typeof ListCompetitorsSchema>;
export type GetCompetitorInput = z.infer<typeof GetCompetitorSchema>;
export type AddFindingInput = z.infer<typeof AddFindingSchema>;
export type SearchFindingsInput = z.infer<typeof SearchFindingsSchema>;
export type UpdateFindingInput = z.infer<typeof UpdateFindingSchema>;
export type RegisterAppInspectionInput = z.infer<typeof RegisterAppInspectionSchema>;
export type AddInspectionScreenInput = z.infer<typeof AddInspectionScreenSchema>;
export type ListAppInspectionsInput = z.infer<typeof ListAppInspectionsSchema>;
export type GetAppInspectionInput = z.infer<typeof GetAppInspectionSchema>;
