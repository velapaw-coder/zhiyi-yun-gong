import { NextResponse } from "next/server";
import { AppError } from "@/server/errors";
import { submitLead, type LeadPayload } from "@/server/leads";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LeadPayload | null;
  if (!body) return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  try {
    const { id, result } = await submitLead(body, ip);
    return NextResponse.json({ ok: true, id, result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.code === "RATE_LIMIT" ? 429 : 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "系统繁忙，请稍后重试" }, { status: 500 });
  }
}
