import { NextRequest, NextResponse } from "next/server";
import { signToken, getCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const creds = getCredentials();

  let role: "admin" | "vendedor" | null = null;
  if (username === "admin" && password === creds.admin) role = "admin";
  else if (username === "vendedor" && password === creds.vendedor) role = "vendedor";

  if (!role) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const token = await signToken({ username, role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("nf_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}
