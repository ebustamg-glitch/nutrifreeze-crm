import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("nf_session")?.value;
  return token ? await verifyToken(token) : null;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactoId = searchParams.get("contacto_id");

  if (contactoId) {
    const rows = await sql`
      SELECT * FROM activities
      WHERE company_id = ${user.company_id} AND contacto_id = ${contactoId}
      ORDER BY fecha DESC
    `;
    return NextResponse.json(rows);
  }

  const rows = await sql`
    SELECT * FROM activities
    WHERE company_id = ${user.company_id}
    ORDER BY fecha DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const act = await req.json();

  await sql`
    INSERT INTO activities (id, company_id, contacto_id, tipo, descripcion, fecha, estado_email, estado_whatsapp, usuario)
    VALUES (
      ${act.id}, ${user.company_id}, ${act.contacto_id}, ${act.tipo},
      ${act.descripcion ?? null}, ${act.fecha ?? new Date().toISOString()},
      ${act.estado_email ?? null}, ${act.estado_whatsapp ?? null}, ${act.usuario ?? null}
    )
    ON CONFLICT (id) DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}
