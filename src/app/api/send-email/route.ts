import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { Resend } from "resend";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const COMPANY_CONFIG: Record<number, { from: string; method: "resend" | "smtp" }> = {
  1: { from: "hola@nutrifreezecdmx.com.mx", method: "smtp" },
  2: { from: "hola@agenziaebg.com.mx",      method: "resend" },
};

export async function POST(req: NextRequest) {
  const token = req.cookies.get("nf_session")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { to, subject, body } = await req.json();
  if (!to || !subject || !body)
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const config = COMPANY_CONFIG[user.company_id];
  if (!config)
    return NextResponse.json({ error: "Empresa no configurada" }, { status: 400 });

  try {
    if (config.method === "resend") {
      await resend.emails.send({
        from: `${user.company_name} <${config.from}>`,
        to,
        subject,
        text: body,
      });
    } else {
      const transporter = nodemailer.createTransport({
        host: "mail.nutrifreezecdmx.com.mx",
        port: 465,
        secure: true,
        auth: {
          user: config.from,
          pass: process.env.NUTRI_SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: `${user.company_name} <${config.from}>`,
        to,
        subject,
        text: body,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al enviar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
