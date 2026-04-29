import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const token = req.cookies.get("nf_session")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "El archivo supera 20 MB" }, { status: 400 });

  const slug = `company_${user.company_id}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const blob = await put(slug, file, { access: "public" });

  return NextResponse.json({ url: blob.url, name: file.name, size: file.size });
}
