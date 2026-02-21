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
