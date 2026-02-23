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

export type RegisterCompetitorInput = z.infer<typeof RegisterCompetitorSchema>;
export type ListCompetitorsInput = z.infer<typeof ListCompetitorsSchema>;
export type GetCompetitorInput = z.infer<typeof GetCompetitorSchema>;
export type AddFindingInput = z.infer<typeof AddFindingSchema>;
export type SearchFindingsInput = z.infer<typeof SearchFindingsSchema>;
export type UpdateFindingInput = z.infer<typeof UpdateFindingSchema>;
