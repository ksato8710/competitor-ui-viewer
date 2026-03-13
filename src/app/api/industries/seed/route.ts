import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, ensureSchema } from '@/lib/db';

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'industries.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'industries.json not found' }, { status: 404 });
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const staticIndustries = JSON.parse(raw) as Array<{
      id: string;
      name: string;
      nameEn: string;
      icon: string;
      description: string;
      categories: Array<{ id: string; name: string; nameEn: string }>;
    }>;

    const db = getDb();
    await ensureSchema(db);

    const now = new Date().toISOString();
    let industriesInserted = 0;
    let categoriesInserted = 0;

    for (let i = 0; i < staticIndustries.length; i++) {
      const ind = staticIndustries[i];

      // Upsert industry (skip if already exists)
      const existing = await db.execute({
        sql: 'SELECT id FROM industries WHERE id = ? LIMIT 1',
        args: [ind.id],
      });

      if (existing.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO industries (id, name, name_en, icon, description, sort_order, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [ind.id, ind.name, ind.nameEn || null, ind.icon || '📱', ind.description || null, i, now, now],
        });
        industriesInserted++;
      }

      for (let j = 0; j < ind.categories.length; j++) {
        const cat = ind.categories[j];
        const catExisting = await db.execute({
          sql: 'SELECT id FROM categories WHERE id = ? LIMIT 1',
          args: [cat.id],
        });

        if (catExisting.rows.length === 0) {
          await db.execute({
            sql: `INSERT INTO categories (id, industry_id, name, name_en, sort_order, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [cat.id, ind.id, cat.name, cat.nameEn || null, j, now, now],
          });
          categoriesInserted++;
        }
      }

      // Ensure "その他" category exists for each industry
      const otherId = `${ind.id}-other`;
      const otherExisting = await db.execute({
        sql: 'SELECT id FROM categories WHERE id = ? LIMIT 1',
        args: [otherId],
      });
      if (otherExisting.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO categories (id, industry_id, name, name_en, sort_order, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [otherId, ind.id, 'その他', 'Other', 999, now, now],
        });
        categoriesInserted++;
      }
    }

    // Ensure a catch-all "その他" industry with "その他" category
    const otherIndExisting = await db.execute({
      sql: "SELECT id FROM industries WHERE id = 'other' LIMIT 1",
      args: [],
    });
    if (otherIndExisting.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO industries (id, name, name_en, icon, description, sort_order, created_at, updated_at)
              VALUES ('other', 'その他', 'Other', '📦', 'その他の業界・カテゴリに属さないアプリ', 999, ?, ?)`,
        args: [now, now],
      });
      industriesInserted++;
    }
    const otherCatExisting = await db.execute({
      sql: "SELECT id FROM categories WHERE id = 'other-general' LIMIT 1",
      args: [],
    });
    if (otherCatExisting.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO categories (id, industry_id, name, name_en, sort_order, created_at, updated_at)
              VALUES ('other-general', 'other', 'その他', 'Other', 0, ?, ?)`,
        args: [now, now],
      });
      categoriesInserted++;
    }

    return NextResponse.json({
      message: 'Seed complete',
      industriesInserted,
      categoriesInserted,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
