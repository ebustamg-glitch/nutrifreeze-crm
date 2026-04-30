import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-setup-secret");
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      password_hash VARCHAR(200) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'vendedor',
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(username, company_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id VARCHAR(50) PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      nombre_negocio VARCHAR(300) NOT NULL,
      nombre_contacto VARCHAR(200),
      telefono VARCHAR(50),
      email VARCHAR(200),
      sitio_web VARCHAR(300),
      direccion VARCHAR(500) DEFAULT '',
      alcaldia VARCHAR(100) DEFAULT '',
      colonia VARCHAR(200),
      segmento VARCHAR(50) DEFAULT 'otro',
      giro_denue VARCHAR(300),
      empleados_rango VARCHAR(50),
      etapa VARCHAR(50) DEFAULT 'nuevo',
      score INTEGER DEFAULT 0,
      notas TEXT,
      fuente VARCHAR(50) DEFAULT 'denue',
      fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
      fecha_ultimo_contacto TIMESTAMPTZ,
      asignado_a VARCHAR(50)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS activities (
      id VARCHAR(50) PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      contacto_id VARCHAR(50) REFERENCES contacts(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      descripcion TEXT,
      fecha TIMESTAMPTZ DEFAULT NOW(),
      estado_email VARCHAR(50),
      estado_whatsapp VARCHAR(50),
      usuario VARCHAR(100)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS citas (
      id VARCHAR(50) PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      contacto_id VARCHAR(50) REFERENCES contacts(id) ON DELETE CASCADE,
      contacto_nombre VARCHAR(300),
      tipo VARCHAR(50) DEFAULT 'visita',
      fecha DATE NOT NULL,
      hora TIME NOT NULL,
      direccion VARCHAR(500),
      notas TEXT,
      asignado_a VARCHAR(50),
      resultado VARCHAR(50),
      completada BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS campaign_templates (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      segmento VARCHAR(50) NOT NULL,
      tipo VARCHAR(20) NOT NULL,
      asunto VARCHAR(300),
      cuerpo TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(company_id, segmento, tipo)
    )
  `;

  // Seed companies
  const nf = await sql`
    INSERT INTO companies (name, slug, email)
    VALUES ('NutriFreeze', 'nutrifreeze', 'nutrifreeze@gmail.com')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
  const ebg = await sql`
    INSERT INTO companies (name, slug, email)
    VALUES ('Agenzia EBG', 'agenzia-ebg', 'agenziaebg@gmail.com')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;

  const bio = await sql`
    INSERT INTO companies (name, slug, email)
    VALUES ('Biorofila', 'biorofila', 'biorofila@gmail.com')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;

  const nfId = nf[0].id;
  const ebgId = ebg[0].id;
  const bioId = bio[0].id;

  // Seed users with hashed passwords
  const passwords = {
    nf_admin: await bcrypt.hash("admin1953", 10),
    nf_vendedor: await bcrypt.hash("vendedor2026*", 10),
    ebg_admin: await bcrypt.hash("adminebg1953", 10),
    ebg_vendedor: await bcrypt.hash("vendedorebg2026*", 10),
    bio_admin: await bcrypt.hash("bioadmin2026*", 10),
    bio_vendedor: await bcrypt.hash("biovendedor2026*", 10),
  };

  await sql`
    INSERT INTO users (username, password_hash, role, company_id)
    VALUES ('admin', ${passwords.nf_admin}, 'admin', ${nfId})
    ON CONFLICT (username, company_id) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  await sql`
    INSERT INTO users (username, password_hash, role, company_id)
    VALUES ('vendedor', ${passwords.nf_vendedor}, 'vendedor', ${nfId})
    ON CONFLICT (username, company_id) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  await sql`
    INSERT INTO users (username, password_hash, role, company_id)
    VALUES ('admin', ${passwords.ebg_admin}, 'admin', ${ebgId})
    ON CONFLICT (username, company_id) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  await sql`
    INSERT INTO users (username, password_hash, role, company_id)
    VALUES ('vendedor', ${passwords.ebg_vendedor}, 'vendedor', ${ebgId})
    ON CONFLICT (username, company_id) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  await sql`
    INSERT INTO users (username, password_hash, role, company_id)
    VALUES ('admin', ${passwords.bio_admin}, 'admin', ${bioId})
    ON CONFLICT (username, company_id) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  await sql`
    INSERT INTO users (username, password_hash, role, company_id)
    VALUES ('vendedor', ${passwords.bio_vendedor}, 'vendedor', ${bioId})
    ON CONFLICT (username, company_id) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;

  return NextResponse.json({ ok: true, companies: { nutrifreeze: nfId, agenzia_ebg: ebgId, biorofila: bioId } });
}
