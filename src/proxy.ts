import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "zhiyi_session";

async function roleOf(token: string | undefined) {
  if (!token || !process.env.SESSION_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") || "").toLowerCase();
  // 规范域名：www 与旧地址 301 到 zhiyiyungong.com（API 不跳，避免 POST 丢失）
  if ((host === "www.zhiyiyungong.com" || host === "zhiyi.chang2.ccwu.cc") && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(`https://zhiyiyungong.com${pathname}${request.nextUrl.search}`, 301);
  }
  if (PUBLIC_FILES.has(pathname)) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    const res = await handle(request, pathname);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  return handle(request, pathname);
}

const PUBLIC_FILES = new Set(["/robots.txt", "/sitemap.xml", "/manifest.webmanifest"]);

async function handle(request: NextRequest, pathname: string) {
  const role = await roleOf(request.cookies.get(COOKIE)?.value);
  if (pathname === "/api/login" || pathname === "/api/calc-config" || pathname === "/calculator") return NextResponse.next();

  if (!role) {
    if (pathname === "/" || pathname === "/home" || pathname === "/login") return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/workbench";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const opsOnly = ["/users", "/audit", "/talents"];
  if (role !== "ops" && opsOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/workbench";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (role === "worker") {
    const blocked = ["/enterprises", "/positions", "/ledgers", "/bills", "/plans", "/proposals"];
    if (blocked.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      const url = request.nextUrl.clone();
      url.pathname = "/workbench";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (role === "enterprise" && (pathname === "/enterprises" || pathname === "/enterprises/new" || pathname === "/proposals/new")) {
    const url = request.nextUrl.clone();
    url.pathname = "/workbench";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
