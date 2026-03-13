import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');
  }
  return createClient({ url, authToken });
}

// POST: Upload screenshot for an inspection screen
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inspectionId } = await params;
    const db = getDb();

    // Verify inspection exists
    const inspection = await db.execute({
      sql: 'SELECT app_package FROM app_inspections WHERE id = ? LIMIT 1',
      args: [inspectionId],
    });
    if (inspection.rows.length === 0) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const screenLabel = formData.get('label') as string || 'screenshot';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    // Find matching screen by label and update with base64 data
    const screen = await db.execute({
      sql: 'SELECT id FROM app_inspection_screens WHERE inspection_id = ? AND label = ? LIMIT 1',
      args: [inspectionId, screenLabel],
    });

    const screenshotUrl = `/api/inspections/${inspectionId}/screenshots?screen_label=${encodeURIComponent(screenLabel)}`;

    if (screen.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE app_inspection_screens SET screenshot_data = ?, screenshot_url = ? WHERE id = ?',
        args: [base64, screenshotUrl, String(screen.rows[0].id)],
      });
    } else {
      // No matching screen found — insert as new record
      const screenId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO app_inspection_screens (id, inspection_id, label, screenshot_data, screenshot_url, sort_order)
              VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM app_inspection_screens WHERE inspection_id = ?))`,
        args: [screenId, inspectionId, screenLabel, base64, screenshotUrl, inspectionId],
      });
    }

    return NextResponse.json({ url: screenshotUrl });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET: Serve screenshot image from DB
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inspectionId } = await params;
    const { searchParams } = new URL(request.url);
    const screenLabel = searchParams.get('screen_label');

    if (!screenLabel) {
      return NextResponse.json({ error: 'screen_label is required' }, { status: 400 });
    }

    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT screenshot_data FROM app_inspection_screens WHERE inspection_id = ? AND label = ? AND screenshot_data IS NOT NULL LIMIT 1',
      args: [inspectionId, screenLabel],
    });

    if (result.rows.length === 0 || !result.rows[0].screenshot_data) {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
    }

    const buffer = Buffer.from(String(result.rows[0].screenshot_data), 'base64');
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
