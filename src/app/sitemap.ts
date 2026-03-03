import type { MetadataRoute } from "next";
import { getAllResearchSlugs } from "@/lib/research";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://competitor-ui-viewer.craftgarden.studio";

  const researchEntries: MetadataRoute.Sitemap = getAllResearchSlugs().map(
    (slug) => ({
      url: `${baseUrl}/research/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }),
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/research`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...researchEntries,
  ];
}
