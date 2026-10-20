import type { Metadata, Viewport } from "next";
import "./globals.css";
import { KEYWORDS, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";

const verification: Metadata["verification"] = {
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
  other: {
    ...(process.env.NEXT_PUBLIC_BAIDU_SITE_VERIFICATION ? { "baidu-site-verification": process.env.NEXT_PUBLIC_BAIDU_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : {}),
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "智翼云工 · 残保金减免与助残就业服务平台",
    template: "%s · 智翼云工",
  },
  description: "智翼云工：企业包容性劳动力与 AI 增长服务平台。残保金计算器、残疾人就业保障金减免测算、企业安置残疾人与助残就业合规交付。",
  keywords: KEYWORDS,
  applicationName: SITE_NAME,
  formatDetection: { telephone: false },
  openGraph: { type: "website", locale: "zh_CN", siteName: SITE_NAME, url: SITE_URL, images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  verification,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#063345",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
