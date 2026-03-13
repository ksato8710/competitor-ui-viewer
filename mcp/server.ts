#!/usr/bin/env npx tsx

import type { InValue } from '@libsql/client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ZodError } from 'zod';

import {
  AddFindingSchema,
  GetCompetitorSchema,
  ListCompetitorsSchema,
  RegisterCompetitorSchema,
  SearchFindingsSchema,
  UpdateFindingSchema,
  RegisterAppInspectionSchema,
  AddInspectionScreenSchema,
  ListAppInspectionsSchema,
  GetAppInspectionSchema,
} from './schemas/index.js';
import { generateId, getDb } from './utils/db.js';

type ToolResult = {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
};

type DbRow = Record<string, unknown>;

const server = new McpServer({
  name: 'app-ui-ux-lab-mcp',
  version: '1.0.0',
});

function successResponse(payload: Record<string, unknown>): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, ...payload }, null, 2),
      },
    ],
  };
}

function formatErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`)
      .join('; ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function errorResponse(error: unknown, fallback: string): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: false,
            error: formatErrorMessage(error, fallback),
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'bigint') {
    return Number(value) === 1;
  }
  if (typeof value === 'string') {
    return value === '1' || value.toLowerCase() === 'true';
  }
  return false;
}

async function initSchema() {
  const db = getDb();

  await db.execute('PRAGMA foreign_keys = ON');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS competitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      category TEXT CHECK (category IN ('quiz-app', 'news-media', 'saas', 'content', 'other')),
      target_audience TEXT,
      strengths TEXT,
      weaknesses TEXT,
      notes TEXT,
      our_project TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS competitor_findings (
      id TEXT PRIMARY KEY,
      competitor_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('ui_pattern', 'feature', 'pricing', 'technology', 'content_strategy', 'ux_flow', 'seo')),
      title TEXT NOT NULL,
      description TEXT,
      screenshot_url TEXT,
      source_url TEXT,
      impact TEXT CHECK (impact IN ('high', 'medium', 'low')),
      actionable INTEGER NOT NULL DEFAULT 0 CHECK (actionable IN (0, 1)),
      action_taken TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS competitor_reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      competitor_ids TEXT,
      summary TEXT,
      report_html TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_inspections (
      id TEXT PRIMARY KEY,
      app_package TEXT NOT NULL,
      app_name TEXT NOT NULL,
      platform TEXT DEFAULT 'Android',
      description TEXT,
      target_users TEXT,
      app_category TEXT,
      navigation_pattern TEXT,
      information_architecture TEXT,
      characteristics TEXT,
      competitor_insights TEXT,
      ux_insights TEXT,
      issues TEXT,
      feature_analysis TEXT,
      screen_transitions TEXT,
      key_flows TEXT,
      summary TEXT,
      screen_count INTEGER DEFAULT 0,
      source_session_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_inspection_screens (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      label TEXT NOT NULL,
      screen_type TEXT,
      description TEXT,
      features TEXT,
      screenshot_url TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (inspection_id) REFERENCES app_inspections(id) ON DELETE CASCADE
    )
  `);

  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_inspections_app_package ON app_inspections(app_package)',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_inspection_screens_inspection_id ON app_inspection_screens(inspection_id)',
  );

  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_competitors_category ON competitors(category)',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_competitors_our_project ON competitors(our_project)',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_findings_competitor_id ON competitor_findings(competitor_id)',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_findings_type ON competitor_findings(type)',
  );
  await db.execute(
    'CREATE INDEX IF NOT EXISTS idx_findings_actionable ON competitor_findings(actionable)',
  );
}

server.registerTool(
  'register_competitor',
  {
    description: '競合サービスを新規登録する',
    inputSchema: RegisterCompetitorSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = RegisterCompetitorSchema.parse(params);
      const db = getDb();
      const id = generateId();
      const now = new Date().toISOString();

      await db.execute({
        sql: `
          INSERT INTO competitors (
            id, name, url, description, category, target_audience,
            strengths, weaknesses, notes, our_project, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          validated.name,
          validated.url,
          validated.description ?? null,
          validated.category ?? null,
          validated.target_audience ?? null,
          validated.strengths ?? null,
          validated.weaknesses ?? null,
          validated.notes ?? null,
          validated.our_project ?? null,
          now,
          now,
        ],
      });

      return successResponse({
        id,
        message: '競合サービスを登録しました',
      });
    } catch (error) {
      return errorResponse(error, '競合サービスの登録に失敗しました');
    }
  },
);

server.registerTool(
  'list_competitors',
  {
    description: '登録済み競合一覧を取得する',
    inputSchema: ListCompetitorsSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = ListCompetitorsSchema.parse(params);
      const db = getDb();

      const where: string[] = [];
      const args: InValue[] = [];

      if (validated.category) {
        where.push('c.category = ?');
        args.push(validated.category);
      }

      if (validated.our_project) {
        where.push('c.our_project = ?');
        args.push(validated.our_project);
      }

      args.push(validated.limit);

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      const result = await db.execute({
        sql: `
          SELECT
            c.id,
            c.name,
            c.url,
            c.category,
            c.our_project,
            c.created_at,
            COUNT(f.id) AS findings_count
          FROM competitors c
          LEFT JOIN competitor_findings f ON f.competitor_id = c.id
          ${whereClause}
          GROUP BY c.id, c.name, c.url, c.category, c.our_project, c.created_at
          ORDER BY c.created_at DESC
          LIMIT ?
        `,
        args,
      });

      const competitors = (result.rows as DbRow[]).map((row) => ({
        id: asString(row.id),
        name: asString(row.name),
        url: asString(row.url),
        category: asString(row.category),
        our_project: asString(row.our_project),
        findingsCount: Number(row.findings_count ?? 0),
        createdAt: asString(row.created_at),
      }));

      return successResponse({
        count: competitors.length,
        competitors,
      });
    } catch (error) {
      return errorResponse(error, '競合一覧の取得に失敗しました');
    }
  },
);

server.registerTool(
  'get_competitor',
  {
    description: '特定競合の詳細を取得する（発見事項一覧含む）',
    inputSchema: GetCompetitorSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = GetCompetitorSchema.parse(params);
      const db = getDb();

      const lookupValue = validated.id ?? validated.name;
      if (!lookupValue) {
        throw new Error('id または name のいずれかを指定してください');
      }

      const competitorResult = await db.execute({
        sql: validated.id
          ? 'SELECT * FROM competitors WHERE id = ? LIMIT 1'
          : 'SELECT * FROM competitors WHERE LOWER(name) = LOWER(?) LIMIT 1',
        args: [lookupValue],
      });

      const competitor = competitorResult.rows[0] as DbRow | undefined;
      if (!competitor) {
        throw new Error('指定した競合サービスが見つかりません');
      }

      const competitorId = asString(competitor.id);
      if (!competitorId) {
        throw new Error('競合IDの取得に失敗しました');
      }

      const findingsResult = await db.execute({
        sql: `
          SELECT
            id,
            competitor_id,
            type,
            title,
            description,
            screenshot_url,
            source_url,
            impact,
            actionable,
            action_taken,
            created_at
          FROM competitor_findings
          WHERE competitor_id = ?
          ORDER BY created_at DESC
        `,
        args: [competitorId],
      });

      const findings = (findingsResult.rows as DbRow[]).map((row) => ({
        id: asString(row.id),
        competitorId: asString(row.competitor_id),
        type: asString(row.type),
        title: asString(row.title),
        description: asString(row.description),
        screenshotUrl: asString(row.screenshot_url),
        sourceUrl: asString(row.source_url),
        impact: asString(row.impact),
        actionable: asBoolean(row.actionable),
        actionTaken: asString(row.action_taken),
        createdAt: asString(row.created_at),
      }));

      return successResponse({
        competitor: {
          id: asString(competitor.id),
          name: asString(competitor.name),
          url: asString(competitor.url),
          description: asString(competitor.description),
          category: asString(competitor.category),
          targetAudience: asString(competitor.target_audience),
          strengths: asString(competitor.strengths),
          weaknesses: asString(competitor.weaknesses),
          notes: asString(competitor.notes),
          ourProject: asString(competitor.our_project),
          createdAt: asString(competitor.created_at),
          updatedAt: asString(competitor.updated_at),
          findings,
        },
      });
    } catch (error) {
      return errorResponse(error, '競合情報の取得に失敗しました');
    }
  },
);

server.registerTool(
  'add_finding',
  {
    description: '競合に関する発見事項を追加する',
    inputSchema: AddFindingSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = AddFindingSchema.parse(params);
      const db = getDb();

      const competitorCheck = await db.execute({
        sql: 'SELECT id FROM competitors WHERE id = ? LIMIT 1',
        args: [validated.competitor_id],
      });

      if (competitorCheck.rows.length === 0) {
        throw new Error(
          `competitor_id "${validated.competitor_id}" は登録されていません`,
        );
      }

      const id = generateId();
      const now = new Date().toISOString();

      await db.execute({
        sql: `
          INSERT INTO competitor_findings (
            id,
            competitor_id,
            type,
            title,
            description,
            source_url,
            impact,
            actionable,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          validated.competitor_id,
          validated.type,
          validated.title,
          validated.description ?? null,
          validated.source_url ?? null,
          validated.impact ?? null,
          validated.actionable ? 1 : 0,
          now,
        ],
      });

      return successResponse({
        id,
        message: '発見事項を追加しました',
      });
    } catch (error) {
      return errorResponse(error, '発見事項の追加に失敗しました');
    }
  },
);

server.registerTool(
  'search_findings',
  {
    description: '競合の発見事項を横断検索する',
    inputSchema: SearchFindingsSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = SearchFindingsSchema.parse(params);
      const db = getDb();

      const where: string[] = [];
      const args: InValue[] = [];

      if (validated.keyword) {
        where.push('(f.title LIKE ? OR f.description LIKE ?)');
        const keyword = `%${validated.keyword}%`;
        args.push(keyword, keyword);
      }

      if (validated.type) {
        where.push('f.type = ?');
        args.push(validated.type);
      }

      if (validated.our_project) {
        where.push('c.our_project = ?');
        args.push(validated.our_project);
      }

      if (validated.actionable_only) {
        where.push('f.actionable = 1');
      }

      args.push(validated.limit);

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      const result = await db.execute({
        sql: `
          SELECT
            f.id,
            c.name AS competitor_name,
            f.type,
            f.title,
            f.description,
            f.impact,
            f.actionable
          FROM competitor_findings f
          JOIN competitors c ON c.id = f.competitor_id
          ${whereClause}
          ORDER BY f.created_at DESC
          LIMIT ?
        `,
        args,
      });

      const findings = (result.rows as DbRow[]).map((row) => ({
        id: asString(row.id),
        competitorName: asString(row.competitor_name),
        type: asString(row.type),
        title: asString(row.title),
        description: asString(row.description),
        impact: asString(row.impact),
        actionable: asBoolean(row.actionable),
      }));

      return successResponse({
        count: findings.length,
        findings,
      });
    } catch (error) {
      return errorResponse(error, '発見事項の検索に失敗しました');
    }
  },
);

server.registerTool(
  'update_finding',
  {
    description: '発見事項を更新する（アクション実施記録等）',
    inputSchema: UpdateFindingSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = UpdateFindingSchema.parse(params);
      const db = getDb();

      const findingCheck = await db.execute({
        sql: 'SELECT id FROM competitor_findings WHERE id = ? LIMIT 1',
        args: [validated.id],
      });

      if (findingCheck.rows.length === 0) {
        throw new Error(`finding_id "${validated.id}" は登録されていません`);
      }

      const updates: string[] = [];
      const args: InValue[] = [];

      if (validated.action_taken !== undefined) {
        updates.push('action_taken = ?');
        args.push(validated.action_taken);
      }

      if (validated.actionable !== undefined) {
        updates.push('actionable = ?');
        args.push(validated.actionable ? 1 : 0);
      }

      if (validated.impact !== undefined) {
        updates.push('impact = ?');
        args.push(validated.impact);
      }

      args.push(validated.id);

      await db.execute({
        sql: `UPDATE competitor_findings SET ${updates.join(', ')} WHERE id = ?`,
        args,
      });

      return successResponse({
        message: '発見事項を更新しました',
      });
    } catch (error) {
      return errorResponse(error, '発見事項の更新に失敗しました');
    }
  },
);

server.registerTool(
  'register_app_inspection',
  {
    description: 'App Inspectorで取得したアプリのUI分析データを登録する。スクリーンショットは別途 add_inspection_screen で登録。',
    inputSchema: RegisterAppInspectionSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = RegisterAppInspectionSchema.parse(params);
      const db = getDb();
      const id = generateId();
      const now = new Date().toISOString();

      // Check if app_package already exists — update if so
      const existing = await db.execute({
        sql: 'SELECT id FROM app_inspections WHERE app_package = ? LIMIT 1',
        args: [validated.app_package],
      });

      if (existing.rows.length > 0) {
        const existingId = asString(existing.rows[0].id)!;
        await db.execute({
          sql: `UPDATE app_inspections SET
            app_name = ?, platform = ?, description = ?, target_users = ?,
            app_category = ?, navigation_pattern = ?, information_architecture = ?,
            characteristics = ?, competitor_insights = ?, ux_insights = ?,
            issues = ?, feature_analysis = ?, screen_transitions = ?,
            key_flows = ?, summary = ?, source_session_id = ?, updated_at = ?
          WHERE id = ?`,
          args: [
            validated.app_name,
            validated.platform,
            validated.description ?? null,
            validated.target_users ?? null,
            validated.app_category ?? null,
            validated.navigation_pattern ?? null,
            validated.information_architecture ?? null,
            validated.characteristics ? JSON.stringify(validated.characteristics) : null,
            validated.competitor_insights ? JSON.stringify(validated.competitor_insights) : null,
            validated.ux_insights ? JSON.stringify(validated.ux_insights) : null,
            validated.issues ? JSON.stringify(validated.issues) : null,
            validated.feature_analysis ? JSON.stringify(validated.feature_analysis) : null,
            validated.screen_transitions ? JSON.stringify(validated.screen_transitions) : null,
            validated.key_flows ? JSON.stringify(validated.key_flows) : null,
            validated.summary ?? null,
            validated.source_session_id ?? null,
            now,
            existingId,
          ],
        });

        // Delete old screens for re-registration
        await db.execute({
          sql: 'DELETE FROM app_inspection_screens WHERE inspection_id = ?',
          args: [existingId],
        });

        return successResponse({
          id: existingId,
          message: '既存のインスペクションデータを更新しました',
          updated: true,
        });
      }

      await db.execute({
        sql: `INSERT INTO app_inspections (
          id, app_package, app_name, platform, description, target_users,
          app_category, navigation_pattern, information_architecture,
          characteristics, competitor_insights, ux_insights, issues,
          feature_analysis, screen_transitions, key_flows, summary,
          source_session_id, screen_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        args: [
          id,
          validated.app_package,
          validated.app_name,
          validated.platform,
          validated.description ?? null,
          validated.target_users ?? null,
          validated.app_category ?? null,
          validated.navigation_pattern ?? null,
          validated.information_architecture ?? null,
          validated.characteristics ? JSON.stringify(validated.characteristics) : null,
          validated.competitor_insights ? JSON.stringify(validated.competitor_insights) : null,
          validated.ux_insights ? JSON.stringify(validated.ux_insights) : null,
          validated.issues ? JSON.stringify(validated.issues) : null,
          validated.feature_analysis ? JSON.stringify(validated.feature_analysis) : null,
          validated.screen_transitions ? JSON.stringify(validated.screen_transitions) : null,
          validated.key_flows ? JSON.stringify(validated.key_flows) : null,
          validated.summary ?? null,
          validated.source_session_id ?? null,
          now,
          now,
        ],
      });

      return successResponse({
        id,
        message: 'アプリインスペクションデータを登録しました',
        updated: false,
      });
    } catch (error) {
      return errorResponse(error, 'インスペクションデータの登録に失敗しました');
    }
  },
);

server.registerTool(
  'add_inspection_screen',
  {
    description: 'インスペクションにスクリーン情報を追加する',
    inputSchema: AddInspectionScreenSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = AddInspectionScreenSchema.parse(params);
      const db = getDb();

      const inspectionCheck = await db.execute({
        sql: 'SELECT id FROM app_inspections WHERE id = ? LIMIT 1',
        args: [validated.inspection_id],
      });
      if (inspectionCheck.rows.length === 0) {
        throw new Error(`inspection_id "${validated.inspection_id}" は登録されていません`);
      }

      const id = generateId();
      await db.execute({
        sql: `INSERT INTO app_inspection_screens (
          id, inspection_id, label, screen_type, description, features, screenshot_url, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          validated.inspection_id,
          validated.label,
          validated.screen_type ?? null,
          validated.description ?? null,
          validated.features ? JSON.stringify(validated.features) : null,
          validated.screenshot_url ?? null,
          validated.sort_order ?? 0,
        ],
      });

      // Update screen_count
      await db.execute({
        sql: `UPDATE app_inspections SET screen_count = (
          SELECT COUNT(*) FROM app_inspection_screens WHERE inspection_id = ?
        ) WHERE id = ?`,
        args: [validated.inspection_id, validated.inspection_id],
      });

      return successResponse({ id, message: 'スクリーン情報を追加しました' });
    } catch (error) {
      return errorResponse(error, 'スクリーン情報の追加に失敗しました');
    }
  },
);

server.registerTool(
  'list_app_inspections',
  {
    description: '登録済みアプリインスペクション一覧を取得する',
    inputSchema: ListAppInspectionsSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = ListAppInspectionsSchema.parse(params);
      const db = getDb();

      const where: string[] = [];
      const args: InValue[] = [];

      if (validated.platform) {
        where.push('platform = ?');
        args.push(validated.platform);
      }
      args.push(validated.limit);

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      const result = await db.execute({
        sql: `SELECT id, app_package, app_name, platform, app_category,
              screen_count, summary, created_at, updated_at
              FROM app_inspections ${whereClause}
              ORDER BY updated_at DESC LIMIT ?`,
        args,
      });

      const inspections = (result.rows as DbRow[]).map((row) => ({
        id: asString(row.id),
        appPackage: asString(row.app_package),
        appName: asString(row.app_name),
        platform: asString(row.platform),
        appCategory: asString(row.app_category),
        screenCount: Number(row.screen_count ?? 0),
        summary: asString(row.summary),
        createdAt: asString(row.created_at),
        updatedAt: asString(row.updated_at),
      }));

      return successResponse({ count: inspections.length, inspections });
    } catch (error) {
      return errorResponse(error, 'インスペクション一覧の取得に失敗しました');
    }
  },
);

server.registerTool(
  'get_app_inspection',
  {
    description: '特定アプリのインスペクション詳細を取得する（スクリーン一覧含む）',
    inputSchema: GetAppInspectionSchema,
  },
  async (params): Promise<ToolResult> => {
    try {
      const validated = GetAppInspectionSchema.parse(params);
      const db = getDb();

      const lookupValue = validated.id ?? validated.app_package;
      if (!lookupValue) throw new Error('id または app_package のいずれかを指定してください');

      const inspectionResult = await db.execute({
        sql: validated.id
          ? 'SELECT * FROM app_inspections WHERE id = ? LIMIT 1'
          : 'SELECT * FROM app_inspections WHERE app_package = ? LIMIT 1',
        args: [lookupValue],
      });

      const row = inspectionResult.rows[0] as DbRow | undefined;
      if (!row) throw new Error('指定したインスペクションが見つかりません');

      const inspectionId = asString(row.id)!;

      const screensResult = await db.execute({
        sql: 'SELECT * FROM app_inspection_screens WHERE inspection_id = ? ORDER BY sort_order',
        args: [inspectionId],
      });

      const screens = (screensResult.rows as DbRow[]).map((s) => ({
        id: asString(s.id),
        label: asString(s.label),
        screenType: asString(s.screen_type),
        description: asString(s.description),
        features: s.features ? JSON.parse(asString(s.features)!) : [],
        screenshotUrl: asString(s.screenshot_url),
        sortOrder: Number(s.sort_order ?? 0),
      }));

      const parseJsonField = (val: unknown) => {
        const str = asString(val);
        if (!str) return null;
        try { return JSON.parse(str); } catch { return null; }
      };

      return successResponse({
        inspection: {
          id: inspectionId,
          appPackage: asString(row.app_package),
          appName: asString(row.app_name),
          platform: asString(row.platform),
          description: asString(row.description),
          targetUsers: asString(row.target_users),
          appCategory: asString(row.app_category),
          navigationPattern: asString(row.navigation_pattern),
          informationArchitecture: asString(row.information_architecture),
          characteristics: parseJsonField(row.characteristics),
          competitorInsights: parseJsonField(row.competitor_insights),
          uxInsights: parseJsonField(row.ux_insights),
          issues: parseJsonField(row.issues),
          featureAnalysis: parseJsonField(row.feature_analysis),
          screenTransitions: parseJsonField(row.screen_transitions),
          keyFlows: parseJsonField(row.key_flows),
          summary: asString(row.summary),
          screenCount: Number(row.screen_count ?? 0),
          sourceSessionId: asString(row.source_session_id),
          createdAt: asString(row.created_at),
          updatedAt: asString(row.updated_at),
          screens,
        },
      });
    } catch (error) {
      return errorResponse(error, 'インスペクション詳細の取得に失敗しました');
    }
  },
);

async function main() {
  await initSchema();
  console.error('AppUIUXLab MCP: Schema initialized');

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AppUIUXLab MCP Server running on stdio');
}

main().catch((error) => {
  console.error('AppUIUXLab MCP Server failed to start', error);
  process.exitCode = 1;
});
