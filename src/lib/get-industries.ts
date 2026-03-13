import fs from 'fs';
import path from 'path';
import { getDb, ensureSchema } from '@/lib/db';
import type { Industry, Category, App, AppScreenshot } from '@/lib/types';

function loadStaticIndustries(): Industry[] {
  const filePath = path.join(process.cwd(), 'public', 'data', 'industries.json');
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function flattenFeatures(parsed: unknown): string[] {
  if (Array.isArray(parsed)) {
    // Could be array of strings or array of objects
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item === 'string') {
        result.push(item);
      } else if (item && typeof item === 'object' && 'name' in item) {
        result.push(String((item as { name: string }).name));
      }
    }
    return result;
  }
  if (parsed && typeof parsed === 'object') {
    // Could be an object with category keys containing arrays
    const result: string[] = [];
    for (const values of Object.values(parsed as Record<string, unknown>)) {
      if (Array.isArray(values)) {
        for (const v of values) {
          if (typeof v === 'string') result.push(v);
          else if (v && typeof v === 'object' && 'name' in v) result.push(String((v as { name: string }).name));
        }
      }
    }
    return result;
  }
  return [];
}

export async function getUnifiedIndustries(): Promise<Industry[]> {
  const staticIndustries = loadStaticIndustries();

  let dbIndustries: Industry[] = [];
  try {
    const db = getDb();
    await ensureSchema(db);

    // Fetch DB apps that have a category_id
    const appsResult = await db.execute(
      `SELECT id, app_package, app_name, platform, description, company, company_en,
              feature_analysis, characteristics, strengths, app_url, app_store_url,
              play_store_url, industry_id, category_id
       FROM app_inspections
       WHERE category_id IS NOT NULL`
    );

    if (appsResult.rows.length === 0) {
      return staticIndustries;
    }

    // Fetch screens for these apps
    const inspectionIds = appsResult.rows.map((r) => String(r.id));
    const screensMap = new Map<string, AppScreenshot[]>();

    // Query screens in batches (libSQL doesn't support IN with dynamic lists easily)
    for (const inspId of inspectionIds) {
      const screensResult = await db.execute({
        sql: 'SELECT label, screenshot_url FROM app_inspection_screens WHERE inspection_id = ? ORDER BY sort_order',
        args: [inspId],
      });
      screensMap.set(
        inspId,
        screensResult.rows.map((s) => ({
          label: String(s.label),
          path: String(s.screenshot_url || ''),
        }))
      );
    }

    // Fetch DB industries and categories
    const dbIndustriesResult = await db.execute(
      'SELECT id, name, name_en, icon, description FROM industries ORDER BY sort_order, name'
    );
    const dbCategoriesResult = await db.execute(
      'SELECT id, industry_id, name, name_en FROM categories ORDER BY sort_order, name'
    );

    // Build DB-only industry map
    const dbIndustryMap = new Map<string, Industry>();
    for (const row of dbIndustriesResult.rows) {
      dbIndustryMap.set(String(row.id), {
        id: String(row.id),
        name: String(row.name),
        nameEn: String(row.name_en || ''),
        icon: String(row.icon || '📱'),
        description: String(row.description || ''),
        categories: [],
      });
    }

    const dbCategoryMap = new Map<string, { industryId: string; category: Category }>();
    for (const row of dbCategoriesResult.rows) {
      const catId = String(row.id);
      const industryId = String(row.industry_id);
      dbCategoryMap.set(catId, {
        industryId,
        category: {
          id: catId,
          name: String(row.name),
          nameEn: String(row.name_en || ''),
          apps: [],
        },
      });
    }

    // Convert DB inspections to App type and group by category
    const appsByCategory = new Map<string, App[]>();
    for (const row of appsResult.rows) {
      const categoryId = String(row.category_id);
      const featuresParsed = safeJsonParse(row.feature_analysis, null);
      const features = flattenFeatures(featuresParsed);

      const strengthsParsed: unknown = safeJsonParse(row.strengths, null);
      const characteristicsParsed: unknown = safeJsonParse(row.characteristics, null);
      const strengthsList: string[] = Array.isArray(strengthsParsed)
        ? strengthsParsed.map(String)
        : Array.isArray(characteristicsParsed)
          ? characteristicsParsed.map(String)
          : [];

      const platformStr = String(row.platform || 'Android');
      const platform = [platformStr] as ("iOS" | "Android" | "Web")[];

      const app: App = {
        id: String(row.id),
        name: String(row.app_name),
        company: String(row.company || row.app_package),
        companyEn: String(row.company_en || ''),
        platform,
        description: String(row.description || ''),
        features,
        strengths: strengthsList,
        appUrl: String(row.app_url || ''),
        appStoreUrl: row.app_store_url ? String(row.app_store_url) : undefined,
        playStoreUrl: row.play_store_url ? String(row.play_store_url) : undefined,
        screenshots: screensMap.get(String(row.id)) || [],
      };

      if (!appsByCategory.has(categoryId)) {
        appsByCategory.set(categoryId, []);
      }
      appsByCategory.get(categoryId)!.push(app);
    }

    // Merge DB apps into static industries
    const mergedIndustries = staticIndustries.map((ind) => ({
      ...ind,
      categories: ind.categories.map((cat) => {
        const dbApps = appsByCategory.get(cat.id);
        if (dbApps) {
          appsByCategory.delete(cat.id);
          return { ...cat, apps: [...cat.apps, ...dbApps] };
        }
        return cat;
      }),
    }));

    // Static industry lookup by id
    const staticIndustryIds = new Set(staticIndustries.map((i) => i.id));
    const staticCategoryIds = new Set(staticIndustries.flatMap((i) => i.categories.map((c) => c.id)));

    // Add remaining DB apps (categories not in static JSON)
    for (const [categoryId, apps] of appsByCategory.entries()) {
      const dbCatEntry = dbCategoryMap.get(categoryId);
      if (!dbCatEntry) continue;

      const { industryId, category } = dbCatEntry;
      category.apps = apps;

      // Find or create industry in merged list
      const existingIndustry = mergedIndustries.find((i) => i.id === industryId);
      if (existingIndustry) {
        // Industry exists but category doesn't
        if (!staticCategoryIds.has(categoryId)) {
          existingIndustry.categories.push(category);
        }
      } else {
        // Industry doesn't exist in static - check if we already added it
        const alreadyAdded = mergedIndustries.find((i) => i.id === industryId);
        if (alreadyAdded) {
          alreadyAdded.categories.push(category);
        } else {
          const dbInd = dbIndustryMap.get(industryId);
          if (dbInd) {
            mergedIndustries.push({ ...dbInd, categories: [category] });
          }
        }
      }
    }

    return mergedIndustries;
  } catch {
    // DB unavailable - return static only
    return staticIndustries;
  }
}
