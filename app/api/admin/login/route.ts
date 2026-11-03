import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const pass = String(form.get("password") ?? "");
  const base = new URL(req.url);
  if (!process.env.ADMIN_PASSWORD || pass !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL("/admin/login?e=1", base), 303);
  }
  const res = NextResponse.redirect(new URL("/admin", base), 303);
  res.cookies.set(ADMIN_COOKIE, await adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
