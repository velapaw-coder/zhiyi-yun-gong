import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "智翼云工 SmartWing Cloudwork",
    short_name: "智翼云工",
    description: "残保金计算器与助残就业服务平台",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFB",
    theme_color: "#0A4D68",
    lang: "zh-CN",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/logo-mark.png", sizes: "256x256", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
