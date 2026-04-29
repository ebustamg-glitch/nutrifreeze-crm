"use client";
import { Contacto, Cita, Actividad, EtapaCRM } from "./types";

// ── Contacts ──────────────────────────────────────────────────────────────────

export async function getContactos(): Promise<Contacto[]> {
  const res = await fetch("/api/contacts");
  if (!res.ok) return [];
  return res.json();
}

export async function addContactos(nuevos: Contacto[]): Promise<number> {
  const res = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contactos: nuevos }),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export async function updateContacto(id: string, cambios: Partial<Contacto>): Promise<void> {
  await fetch(`/api/contacts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cambios),
  });
}

export async function deleteContacto(id: string): Promise<void> {
  await fetch(`/api/contacts/${id}`, { method: "DELETE" });
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function getActividades(): Promise<Actividad[]> {
  const res = await fetch("/api/activities");
  if (!res.ok) return [];
  return res.json();
}

export async function addActividad(act: Actividad): Promise<void> {
  await fetch("/api/activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(act),
  });
}

// ── Citas ─────────────────────────────────────────────────────────────────────

export async function getCitas(): Promise<Cita[]> {
  const res = await fetch("/api/citas");
  if (!res.ok) return [];
  return res.json();
}

export async function saveCita(cita: Cita): Promise<void> {
  await fetch("/api/citas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cita),
  });
}

export async function deleteCita(id: string): Promise<void> {
  await fetch(`/api/citas/${id}`, { method: "DELETE" });
}

// ── Campaign templates ────────────────────────────────────────────────────────

export async function getCampaignTemplates(): Promise<Record<string, Record<string, { asunto?: string; cuerpo: string }>>> {
  const res = await fetch("/api/campaign-templates");
  if (!res.ok) return {};
  return res.json();
}

export async function saveCampaignTemplate(
  segmento: string,
  tipo: "email" | "wa",
  asunto: string | undefined,
  cuerpo: string
): Promise<void> {
  await fetch("/api/campaign-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segmento, tipo, asunto, cuerpo }),
  });
}

// ── Resumen (computed client-side) ───────────────────────────────────────────

export function getResumen(contactos: Contacto[], citas: Cita[]) {
  const etapas: Record<EtapaCRM, number> = {
    nuevo: 0, contactado: 0, interesado: 0,
    cita_agendada: 0, visitado: 0, cerrado: 0, descartado: 0,
  };
  contactos.forEach((c) => { etapas[c.etapa]++; });
  return {
    total: contactos.length,
    etapas,
    citas_pendientes: citas.filter((c) => !c.completada).length,
    cerrados: etapas.cerrado,
  };
}
