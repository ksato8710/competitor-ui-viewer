import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';

// GET: Fetch single inspection with full report data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    await ensureSchema(db);

    const result = await db.execute({
      sql: 'SELECT * FROM app_inspections WHERE id = ? LIMIT 1',
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Parse JSON fields
    const safeJson = (val: unknown) => {
      if (!val || typeof val !== 'string') return null;
      try { return JSON.parse(val); } catch { return null; }
    };

    return NextResponse.json({
      id: row.id,
      app_package: row.app_package,
      app_name: row.app_name,
      platform: row.platform,
      description: row.description,
      target_users: row.target_users,
      app_category: row.app_category,
      company: row.company,
      company_en: row.company_en,
      summary: row.summary,
      report_json: safeJson(row.report_json),
      features: safeJson(row.features),
      characteristics: safeJson(row.characteristics),
      strengths: safeJson(row.strengths),
      feature_analysis: safeJson(row.feature_analysis),
      competitor_insights: safeJson(row.competitor_insights),
      issues: safeJson(row.issues),
      screen_transitions: safeJson(row.screen_transitions),
      navigation_pattern: row.navigation_pattern,
      information_architecture: row.information_architecture,
      key_flows: safeJson(row.key_flows),
      screen_count: row.screen_count,
      industry_id: row.industry_id,
      category_id: row.category_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
