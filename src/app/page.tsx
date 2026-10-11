import { LandingPage } from "@/components/landing-page";
import { getActor } from "@/server/session";

export const metadata = {
  title: "智翼云工 SmartWing Cloudwork",
  description: "把合规责任转化为增长动能。企业包容性劳动力与 AI 增长共创平台。五流合一，可审计的确定性成果。",
};

export default async function HomePage() {
  const actor = await getActor();
  return <LandingPage signedIn={Boolean(actor)} />;
}
