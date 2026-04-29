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

  const rows = await sql`
    SELECT * FROM citas
    WHERE company_id = ${user.company_id}
    ORDER BY fecha ASC, hora ASC
  `;

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const c = await req.json();

  await sql`
    INSERT INTO citas (id, company_id, contacto_id, contacto_nombre, tipo, fecha, hora, direccion, notas, asignado_a, resultado, completada)
    VALUES (
      ${c.id}, ${user.company_id}, ${c.contacto_id}, ${c.contacto_nombre ?? null},
      ${c.tipo ?? "visita"}, ${c.fecha}, ${c.hora},
      ${c.direccion ?? null}, ${c.notas ?? null}, ${c.asignado_a ?? null},
      ${c.resultado ?? null}, ${c.completada ?? false}
    )
    ON CONFLICT (id) DO UPDATE SET
      tipo = EXCLUDED.tipo,
      fecha = EXCLUDED.fecha,
      hora = EXCLUDED.hora,
      direccion = EXCLUDED.direccion,
      notas = EXCLUDED.notas,
      asignado_a = EXCLUDED.asignado_a,
      resultado = EXCLUDED.resultado,
      completada = EXCLUDED.completada
  `;

  return NextResponse.json({ ok: true });
}
