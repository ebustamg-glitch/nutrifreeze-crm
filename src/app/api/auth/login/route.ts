import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const rows = await sql`
    SELECT u.id, u.username, u.password_hash, u.role, u.company_id,
           c.name AS company_name, c.slug AS company_slug
    FROM users u
    JOIN companies c ON c.id = u.company_id
    WHERE u.username = ${username}
  `;

  for (const u of rows) {
    const valid = await bcrypt.compare(password, u.password_hash);
    if (valid) {
      const token = await signToken({
        id: u.id,
        username: u.username,
        role: u.role as "admin" | "vendedor",
        company_id: u.company_id,
        company_name: u.company_name,
        company_slug: u.company_slug,
      });
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
  }

  return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
}
