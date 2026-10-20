export const SITE_URL = "https://zhiyiyungong.com";
export const SITE_NAME = "智翼云工";
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "智翼云工 SmartWing Cloudwork · 残保金计算器 · 助残就业" };
export const KEYWORDS = ["残保金计算器", "残保金减免", "残疾人就业保障金", "助残就业", "企业安置残疾人", "灵活用工 助残", "残保金测算", "智翼云工"];

export const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "深圳市智翼云工科技有限公司",
      alternateName: ["智翼云工", "SmartWing Cloudwork"],
      url: SITE_URL,
      logo: `${SITE_URL}/brand/logo-mark.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "zh-CN",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
  ],
};

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
