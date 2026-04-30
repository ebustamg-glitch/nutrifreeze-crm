import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== process.env.AGENT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { company_slug, mensaje, waha_url, waha_key, delay_ms = 4000 } = await req.json();
  if (!company_slug || !mensaje || !waha_url || !waha_key) {
    return NextResponse.json({ error: "company_slug, mensaje, waha_url y waha_key requeridos" }, { status: 400 });
  }

  const company = await sql`
    SELECT id FROM companies WHERE slug = ${company_slug} LIMIT 1
  `;
  if (!company.length) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }
  const company_id = company[0].id;

  // Leads sin conversión que no han sido contactados en los últimos 7 días
  const leads = await sql`
    SELECT id, telefono, nombre_negocio
    FROM contacts
    WHERE company_id = ${company_id}
      AND fuente = 'whatsapp'
      AND etapa = 'sin_conversion'
      AND (
        fecha_ultimo_contacto IS NULL
        OR fecha_ultimo_contacto < NOW() - INTERVAL '7 days'
      )
    ORDER BY fecha_ultimo_contacto DESC NULLS LAST
    LIMIT 200
  `;

  if (!leads.length) {
    return NextResponse.json({ ok: true, enviados: 0, mensaje: "Sin leads pendientes" });
  }

  let enviados = 0;
  const errores: string[] = [];

  for (const lead of leads) {
    const chatId = `${lead.telefono}@c.us`;
    try {
      const res = await fetch(`${waha_url}/api/sendText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": waha_key
        },
        body: JSON.stringify({ chatId, text: mensaje, session: "default" })
      });

      if (res.ok) {
        enviados++;
        await sql`
          UPDATE contacts
          SET etapa = 'contactado_campana', fecha_ultimo_contacto = NOW()
          WHERE id = ${lead.id}
        `;
      } else {
        errores.push(`${lead.telefono}: HTTP ${res.status}`);
      }
    } catch (e: unknown) {
      errores.push(`${lead.telefono}: ${e instanceof Error ? e.message : String(e)}`);
    }

    await sleep(delay_ms);
  }

  return NextResponse.json({ ok: true, total: leads.length, enviados, errores });
}

// GET — consulta leads sin conversión para una empresa (para el dashboard CRM)
export async function GET(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== process.env.AGENT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company_slug = req.nextUrl.searchParams.get("company_slug");
  if (!company_slug) return NextResponse.json({ error: "company_slug requerido" }, { status: 400 });

  const company = await sql`SELECT id FROM companies WHERE slug = ${company_slug} LIMIT 1`;
  if (!company.length) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });

  const leads = await sql`
    SELECT id, telefono, nombre_negocio, score, notas, fecha_creacion, fecha_ultimo_contacto
    FROM contacts
    WHERE company_id = ${company[0].id}
      AND fuente = 'whatsapp'
      AND etapa = 'sin_conversion'
    ORDER BY fecha_creacion DESC
  `;

  return NextResponse.json(leads);
}
