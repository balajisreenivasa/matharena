import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", expires: new Date(0), path: "/" });
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
