import { NextResponse } from "next/server";
import { getServiceFeeFen } from "@/server/proposals";

/** 公开读取计算器默认服务费。只读一个配置值，CDN 缓存 5 分钟。 */
export async function GET() {
  let fen = 50000;
  try {
    fen = await getServiceFeeFen();
  } catch {
    // 数据库不可用时用默认值，计算器照常工作
  }
  return NextResponse.json(
    { serviceFeeYuan: fen / 100 },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
