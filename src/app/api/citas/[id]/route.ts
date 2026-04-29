import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("nf_session")?.value;
  return token ? await verifyToken(token) : null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM citas WHERE id = ${id} AND company_id = ${user.company_id}`;

  return NextResponse.json({ ok: true });
}
