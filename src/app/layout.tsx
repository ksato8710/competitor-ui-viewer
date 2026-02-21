import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Competitor UI Viewer",
  description: "競合UIの分析レポートビューア — サムネイル表示 & インラインプレビュー",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
