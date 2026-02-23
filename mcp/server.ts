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
  name: 'competitor-ui-viewer-mcp',
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

async function main() {
  await initSchema();
  console.error('Competitor UI Viewer MCP: Schema initialized');

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Competitor UI Viewer MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Competitor UI Viewer MCP Server failed to start', error);
  process.exitCode = 1;
});
