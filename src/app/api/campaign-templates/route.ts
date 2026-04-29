import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("nf_session")?.value;
  return token ? await verifyToken(token) : null;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({}, { status: 401 });

  const rows = await sql`
    SELECT segmento, tipo, asunto, cuerpo
    FROM campaign_templates
    WHERE company_id = ${user.company_id}
  `;

  const result: Record<string, Record<string, { asunto?: string; cuerpo: string }>> = {};
  for (const row of rows) {
    if (!result[row.segmento]) result[row.segmento] = {};
    result[row.segmento][row.tipo] = { asunto: row.asunto, cuerpo: row.cuerpo };
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { segmento, tipo, asunto, cuerpo } = await req.json();

  await sql`
    INSERT INTO campaign_templates (company_id, segmento, tipo, asunto, cuerpo, updated_at)
    VALUES (${user.company_id}, ${segmento}, ${tipo}, ${asunto ?? null}, ${cuerpo}, NOW())
    ON CONFLICT (company_id, segmento, tipo) DO UPDATE SET
      asunto = EXCLUDED.asunto,
      cuerpo = EXCLUDED.cuerpo,
      updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
