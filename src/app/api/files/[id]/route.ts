import { NextResponse } from "next/server";
import { getActor } from "@/server/session";
import { contentDisposition, readAuthorizedFile } from "@/server/files";
import { AppError } from "@/server/errors";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await context.params;
  try {
    const result = await readAuthorizedFile(actor, id);
    return new NextResponse(result.bytes, {
      headers: {
        "Content-Type": result.file.mime,
        "Content-Length": String(result.bytes.byteLength),
        "Content-Disposition": contentDisposition(result.file.originalName, result.inline),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "读取附件失败" }, { status: 500 });
  }
}
