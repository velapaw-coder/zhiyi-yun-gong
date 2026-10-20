import type { Metadata } from "next";
import { JsonLd, KEYWORDS, OG_IMAGE, orgJsonLd } from "@/lib/seo";
import { LandingPage } from "@/components/landing-page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: "智翼云工 · 残保金减免、企业安置残疾人与助残就业服务平台" },
  description:
    "智翼云工 SmartWing Cloudwork：把残疾人就业保障金（残保金）合规成本变成企业增长生产力。免费残保金计算器，真实劳动关系、AI 数字岗位、标准工单与可验收交付，五流合一可审计。",
  keywords: KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: { url: "/", title: "智翼云工 · 残保金减免与助残就业服务平台", images: [OG_IMAGE] },
};

// 首页静态预渲染。已登录用户点「登录控制台」时，proxy 会把 /login 直接转到 /workbench。
export default function HomePage() {
  return (
    <>
      <JsonLd data={orgJsonLd} />
      <LandingPage />
    </>
  );
}
