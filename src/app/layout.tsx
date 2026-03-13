import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppUIUXLab",
  description: "競合UIの分析レポートビューア — サムネイル表示 & インラインプレビュー",
  openGraph: {
    title: "AppUIUXLab",
    description: "競合UIの分析・比較ビューア",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AppUIUXLab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AppUIUXLab",
    description: "競合UIの分析・比較ビューア",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
</body>
    </html>
  );
}
