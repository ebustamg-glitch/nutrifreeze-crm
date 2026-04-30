import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== process.env.AGENT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { telefono, nombre, score, ultimo_mensaje, company_slug } = await req.json();
  if (!telefono || !company_slug) {
    return NextResponse.json({ error: "telefono y company_slug requeridos" }, { status: 400 });
  }

  const company = await sql`
    SELECT id FROM companies WHERE slug = ${company_slug} LIMIT 1
  `;
  if (!company.length) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }
  const company_id = company[0].id;
  const id = `wa_${company_slug}_${telefono}`;

  await sql`
    INSERT INTO contacts (
      id, company_id, nombre_negocio, nombre_contacto, telefono,
      etapa, score, fuente, notas, fecha_creacion, fecha_ultimo_contacto
    ) VALUES (
      ${id}, ${company_id},
      ${nombre || telefono},
      ${nombre || null},
      ${telefono},
      'sin_conversion',
      ${score === 'caliente' ? 80 : score === 'tibio' ? 50 : 20},
      'whatsapp',
      ${ultimo_mensaje || null},
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      fecha_ultimo_contacto = NOW(),
      notas = EXCLUDED.notas,
      etapa = CASE
        WHEN contacts.etapa = 'convertido' THEN 'convertido'
        ELSE 'sin_conversion'
      END
  `;

  return NextResponse.json({ ok: true, id });
}
