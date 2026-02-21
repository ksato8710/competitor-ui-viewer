export interface CompetitorScore {
  url: string;
  viewport: string;
  score: number;
}

export interface CompetitorThumbnail {
  url: string;
  viewport: string;
  foldPath: string;
}

export interface CompetitorReport {
  id: string;
  timestamp: string;
  preset: string;
  urls: string[];
  viewports: string[];
  scores: CompetitorScore[];
  comparison: { winner: string } | null;
  thumbnails?: CompetitorThumbnail[];
}

// --- Industry / Category / App models ---

export interface AppScreenshot {
  label: string;
  path: string;
}

export interface App {
  id: string;
  name: string;
  company: string;
  companyEn: string;
  platform: ("iOS" | "Android" | "Web")[];
  description: string;
  features: string[];
  strengths: string[];
  appUrl: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
  screenshots: AppScreenshot[];
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  apps: App[];
}

export interface Industry {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  categories: Category[];
}
