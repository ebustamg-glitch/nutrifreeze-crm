import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const ALLOWED = [
  "nombre_negocio", "nombre_contacto", "telefono", "email", "sitio_web",
  "etapa", "notas", "fecha_ultimo_contacto", "asignado_a", "score",
];

async function getUser(req: NextRequest) {
  const token = req.cookies.get("nf_session")?.value;
  return token ? await verifyToken(token) : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cambios = await req.json() as Record<string, unknown>;
  const fields = Object.keys(cambios).filter((f) => ALLOWED.includes(f));
  if (fields.length === 0) return NextResponse.json({ ok: true });

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const values = [...fields.map((f) => cambios[f]), id, user.company_id];

  await pool.query(
    `UPDATE contacts SET ${setClause} WHERE id = $${fields.length + 1} AND company_id = $${fields.length + 2}`,
    values
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await pool.query(
    "DELETE FROM contacts WHERE id = $1 AND company_id = $2",
    [id, user.company_id]
  );

  return NextResponse.json({ ok: true });
}
