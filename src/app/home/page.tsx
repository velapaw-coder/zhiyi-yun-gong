import { LandingPage } from "@/components/landing-page";

export const dynamic = "force-static";

export const metadata = {
  title: "产品介绍",
  description: "智翼云工 / SmartWing Cloudwork。以科技赋翼，让合规生长。",
  alternates: { canonical: "/" },
};

export default function IntroPage() {
  return <LandingPage />;
}
