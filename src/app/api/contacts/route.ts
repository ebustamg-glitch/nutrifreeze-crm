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
    SELECT * FROM contacts
    WHERE company_id = ${user.company_id}
    ORDER BY fecha_creacion DESC
  `;

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactos } = await req.json() as { contactos: Record<string, unknown>[] };

  const existing = await sql`
    SELECT id FROM contacts WHERE company_id = ${user.company_id}
  `;
  const ids = new Set(existing.map((r) => r.id));
  const nuevos = contactos.filter((c) => !ids.has(c.id as string));

  for (const c of nuevos) {
    await sql`
      INSERT INTO contacts (
        id, company_id, nombre_negocio, nombre_contacto, telefono, email,
        sitio_web, direccion, alcaldia, colonia, segmento, giro_denue,
        empleados_rango, etapa, score, notas, fuente, fecha_creacion,
        fecha_ultimo_contacto, asignado_a
      ) VALUES (
        ${c.id as string}, ${user.company_id}, ${c.nombre_negocio as string},
        ${(c.nombre_contacto as string) ?? null}, ${(c.telefono as string) ?? null},
        ${(c.email as string) ?? null}, ${(c.sitio_web as string) ?? null},
        ${(c.direccion as string) ?? ""}, ${(c.alcaldia as string) ?? ""},
        ${(c.colonia as string) ?? null}, ${(c.segmento as string) ?? "otro"},
        ${(c.giro_denue as string) ?? null}, ${(c.empleados_rango as string) ?? null},
        ${(c.etapa as string) ?? "nuevo"}, ${(c.score as number) ?? 0},
        ${(c.notas as string) ?? null}, ${(c.fuente as string) ?? "denue"},
        ${(c.fecha_creacion as string) ?? new Date().toISOString()},
        ${(c.fecha_ultimo_contacto as string) ?? null}, ${(c.asignado_a as string) ?? null}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  return NextResponse.json({ count: nuevos.length });
}
