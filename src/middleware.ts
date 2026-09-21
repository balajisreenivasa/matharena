// Gate every page behind login. The edge runtime cannot read the secret file, so this
// only checks that a well-formed, unexpired session cookie exists; getLearner()
// verifies the signature on the server and bounces to /login if it is forged.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const PUBLIC = ["/login", "/signup", "/api/auth", "/api/cron"]; // cron has its own bearer secret

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const parts = token?.split(".") ?? [];
  const exp = parts.length === 3 ? parseInt(parts[1], 10) : NaN;
  if (parts.length === 3 && Number.isFinite(exp) && exp > Date.now()) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
