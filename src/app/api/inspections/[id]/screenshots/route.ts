import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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
    const screenId = formData.get('screen_id') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const appPackage = String(inspection.rows[0].app_package);
    const dir = join(process.cwd(), 'public', 'data', 'app-inspections', appPackage);
    await mkdir(dir, { recursive: true });

    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${screenLabel.replace(/[^a-zA-Z0-9\u3000-\u9fff-]/g, '_')}_${Date.now()}.${ext}`;
    const filePath = join(dir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const publicUrl = `/data/app-inspections/${appPackage}/${fileName}`;

    // Update screen record if screen_id provided
    if (screenId) {
      await db.execute({
        sql: 'UPDATE app_inspection_screens SET screenshot_url = ? WHERE id = ? AND inspection_id = ?',
        args: [publicUrl, screenId, inspectionId],
      });
    }

    return NextResponse.json({ url: publicUrl, fileName });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
