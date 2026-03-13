import { NextResponse } from 'next/server';
import { getDb, ensureSchema } from '@/lib/db';

function generateId() {
  return crypto.randomUUID();
}

// GET: List inspections
export async function GET() {
  try {
    const db = getDb();
    await ensureSchema(db);
    const result = await db.execute(
      'SELECT id, app_package, app_name, platform, app_category, industry_id, category_id, company, screen_count, summary, created_at, updated_at FROM app_inspections ORDER BY updated_at DESC LIMIT 50'
    );
    return NextResponse.json({ inspections: result.rows });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST: Register or update inspection
export async function POST(request: Request) {
  try {
    const db = getDb();
    await ensureSchema(db);
    const body = await request.json();
    const now = new Date().toISOString();

    // Check if exists
    const existing = await db.execute({
      sql: 'SELECT id FROM app_inspections WHERE app_package = ? LIMIT 1',
      args: [body.app_package],
    });

    let inspectionId: string;
    let updated = false;

    if (existing.rows.length > 0) {
      inspectionId = String(existing.rows[0].id);
      updated = true;
      await db.execute({
        sql: `UPDATE app_inspections SET
          app_name = ?, platform = ?, description = ?, target_users = ?,
          app_category = ?, navigation_pattern = ?, information_architecture = ?,
          characteristics = ?, competitor_insights = ?, ux_insights = ?,
          issues = ?, feature_analysis = ?, screen_transitions = ?,
          key_flows = ?, summary = ?, source_session_id = ?,
          industry_id = ?, category_id = ?, company = ?, company_en = ?,
          strengths = ?, app_url = ?, app_store_url = ?, play_store_url = ?,
          features = ?, updated_at = ?
        WHERE id = ?`,
        args: [
          body.app_name, body.platform || 'Android',
          body.description || null, body.target_users || null,
          body.app_category || null, body.navigation_pattern || null,
          body.information_architecture || null,
          body.characteristics ? JSON.stringify(body.characteristics) : null,
          body.competitor_insights ? JSON.stringify(body.competitor_insights) : null,
          body.ux_insights ? JSON.stringify(body.ux_insights) : null,
          body.issues ? JSON.stringify(body.issues) : null,
          body.feature_analysis ? JSON.stringify(body.feature_analysis) : null,
          body.screen_transitions ? JSON.stringify(body.screen_transitions) : null,
          body.key_flows ? JSON.stringify(body.key_flows) : null,
          body.summary || null, body.source_session_id || null,
          body.industry_id || null, body.category_id || null,
          body.company || null, body.company_en || null,
          body.strengths ? JSON.stringify(body.strengths) : null,
          body.app_url || null, body.app_store_url || null, body.play_store_url || null,
          body.features ? JSON.stringify(body.features) : null,
          now, inspectionId,
        ],
      });
      // Clear old screens
      await db.execute({ sql: 'DELETE FROM app_inspection_screens WHERE inspection_id = ?', args: [inspectionId] });
    } else {
      inspectionId = generateId();
      await db.execute({
        sql: `INSERT INTO app_inspections (
          id, app_package, app_name, platform, description, target_users,
          app_category, navigation_pattern, information_architecture,
          characteristics, competitor_insights, ux_insights, issues,
          feature_analysis, screen_transitions, key_flows, summary,
          source_session_id, industry_id, category_id, company, company_en,
          strengths, app_url, app_store_url, play_store_url, features,
          screen_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        args: [
          inspectionId, body.app_package, body.app_name,
          body.platform || 'Android',
          body.description || null, body.target_users || null,
          body.app_category || null, body.navigation_pattern || null,
          body.information_architecture || null,
          body.characteristics ? JSON.stringify(body.characteristics) : null,
          body.competitor_insights ? JSON.stringify(body.competitor_insights) : null,
          body.ux_insights ? JSON.stringify(body.ux_insights) : null,
          body.issues ? JSON.stringify(body.issues) : null,
          body.feature_analysis ? JSON.stringify(body.feature_analysis) : null,
          body.screen_transitions ? JSON.stringify(body.screen_transitions) : null,
          body.key_flows ? JSON.stringify(body.key_flows) : null,
          body.summary || null, body.source_session_id || null,
          body.industry_id || null, body.category_id || null,
          body.company || null, body.company_en || null,
          body.strengths ? JSON.stringify(body.strengths) : null,
          body.app_url || null, body.app_store_url || null, body.play_store_url || null,
          body.features ? JSON.stringify(body.features) : null,
          now, now,
        ],
      });
    }

    // Register screens if provided
    if (body.screens && Array.isArray(body.screens)) {
      for (let i = 0; i < body.screens.length; i++) {
        const s = body.screens[i];
        await db.execute({
          sql: `INSERT INTO app_inspection_screens (id, inspection_id, label, screen_type, description, features, screenshot_url, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            generateId(), inspectionId, s.label || `Screen ${i + 1}`,
            s.screen_type || null, s.description || null,
            s.features ? JSON.stringify(s.features) : null,
            s.screenshot_url || null, i,
          ],
        });
      }
      await db.execute({
        sql: 'UPDATE app_inspections SET screen_count = ? WHERE id = ?',
        args: [body.screens.length, inspectionId],
      });
    }

    return NextResponse.json({ id: inspectionId, updated, message: updated ? '更新しました' : '登録しました' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
