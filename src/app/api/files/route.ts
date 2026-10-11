import { NextResponse } from "next/server";
import { getActor } from "@/server/session";
import { saveUpload } from "@/server/files";
import { AppError } from "@/server/errors";

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  try {
    const saved = await saveUpload(actor, file);
    return NextResponse.json({ id: saved.id, name: saved.originalName, size: saved.size });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
