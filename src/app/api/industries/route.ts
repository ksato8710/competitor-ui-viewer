import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, ensureSchema } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const db = getDb();
    await ensureSchema(db);

    const industriesResult = await db.execute(
      'SELECT id, name, name_en, icon, description, sort_order FROM industries ORDER BY sort_order, name'
    );

    if (industriesResult.rows.length > 0) {
      // Serve from DB
      const categoriesResult = await db.execute(
        'SELECT id, industry_id, name, name_en, sort_order FROM categories ORDER BY sort_order, name'
      );

      const categoriesByIndustry = new Map<string, { id: string; name: string; name_en: string }[]>();
      for (const row of categoriesResult.rows) {
        const industryId = String(row.industry_id);
        if (!categoriesByIndustry.has(industryId)) {
          categoriesByIndustry.set(industryId, []);
        }
        categoriesByIndustry.get(industryId)!.push({
          id: String(row.id),
          name: String(row.name),
          name_en: String(row.name_en || ''),
        });
      }

      const industries = industriesResult.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        name_en: String(row.name_en || ''),
        icon: String(row.icon || '📱'),
        categories: categoriesByIndustry.get(String(row.id)) || [],
      }));

      return NextResponse.json({ industries }, { headers: corsHeaders });
    }

    // Fallback: read from static JSON
    const filePath = path.join(process.cwd(), 'public', 'data', 'industries.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ industries: [] }, { headers: corsHeaders });
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const staticIndustries = JSON.parse(raw) as Array<{
      id: string;
      name: string;
      nameEn: string;
      icon: string;
      categories: Array<{ id: string; name: string; nameEn: string }>;
    }>;

    const industries = staticIndustries.map((ind) => ({
      id: ind.id,
      name: ind.name,
      name_en: ind.nameEn,
      icon: ind.icon,
      categories: ind.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        name_en: cat.nameEn,
      })),
    }));

    return NextResponse.json({ industries }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500, headers: corsHeaders });
  }
}
