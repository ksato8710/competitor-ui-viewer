import { createClient, type Client } from '@libsql/client';

let schemaInitialized = false;

export function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');
  }
  return createClient({ url, authToken });
}

export async function ensureSchema(db: Client) {
  if (schemaInitialized) return;
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS app_inspections (
      id TEXT PRIMARY KEY,
      app_package TEXT NOT NULL UNIQUE,
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
      source_session_id TEXT,
      screen_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_inspection_screens (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      label TEXT NOT NULL,
      screen_type TEXT,
      description TEXT,
      features TEXT,
      screenshot_url TEXT,
      screenshot_data TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (inspection_id) REFERENCES app_inspections(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS industries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_en TEXT,
      icon TEXT DEFAULT '📱',
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      industry_id TEXT NOT NULL,
      name TEXT NOT NULL,
      name_en TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE CASCADE
    );
  `);

  // Migrations for new columns (ignore if already exist)
  const alterColumns = [
    'ALTER TABLE app_inspection_screens ADD COLUMN screenshot_data TEXT',
    'ALTER TABLE app_inspections ADD COLUMN industry_id TEXT',
    'ALTER TABLE app_inspections ADD COLUMN category_id TEXT',
    'ALTER TABLE app_inspections ADD COLUMN company TEXT',
    'ALTER TABLE app_inspections ADD COLUMN company_en TEXT',
    'ALTER TABLE app_inspections ADD COLUMN strengths TEXT',
    'ALTER TABLE app_inspections ADD COLUMN app_url TEXT',
    'ALTER TABLE app_inspections ADD COLUMN app_store_url TEXT',
    'ALTER TABLE app_inspections ADD COLUMN play_store_url TEXT',
    'ALTER TABLE app_inspections ADD COLUMN features TEXT',
  ];
  for (const sql of alterColumns) {
    try {
      await db.execute(sql);
    } catch {
      // Column already exists - ignore
    }
  }

  schemaInitialized = true;
}
