"use client";
import { Contacto, Cita, Actividad, EtapaCRM } from "./types";

const CONTACTOS_KEY = "nf_contactos";
const CITAS_KEY = "nf_citas";
const ACTIVIDADES_KEY = "nf_actividades";

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getContactos(): Contacto[] {
  return getItem<Contacto[]>(CONTACTOS_KEY, []);
}

export function saveContactos(contactos: Contacto[]) {
  setItem(CONTACTOS_KEY, contactos);
}

export function addContactos(nuevos: Contacto[]) {
  const existentes = getContactos();
  const ids = new Set(existentes.map((c) => c.id));
  const filtrados = nuevos.filter((c) => !ids.has(c.id));
  saveContactos([...existentes, ...filtrados]);
  return filtrados.length;
}

export function updateContacto(id: string, cambios: Partial<Contacto>) {
  const contactos = getContactos();
  const idx = contactos.findIndex((c) => c.id === id);
  if (idx === -1) return;
  contactos[idx] = { ...contactos[idx], ...cambios };
  saveContactos(contactos);
}

export function deleteContacto(id: string) {
  saveContactos(getContactos().filter((c) => c.id !== id));
}

export function getCitas(): Cita[] {
  return getItem<Cita[]>(CITAS_KEY, []);
}

export function saveCita(cita: Cita) {
  const citas = getCitas();
  const idx = citas.findIndex((c) => c.id === cita.id);
  if (idx === -1) {
    citas.push(cita);
  } else {
    citas[idx] = cita;
  }
  setItem(CITAS_KEY, citas);
}

export function deleteCita(id: string) {
  setItem(CITAS_KEY, getCitas().filter((c) => c.id !== id));
}

export function getActividades(): Actividad[] {
  return getItem<Actividad[]>(ACTIVIDADES_KEY, []);
}

export function addActividad(act: Actividad) {
  const actividades = getActividades();
  actividades.push(act);
  setItem(ACTIVIDADES_KEY, actividades);
}

export function getActividadesByContacto(contactoId: string): Actividad[] {
  return getActividades().filter((a) => a.contacto_id === contactoId);
}

const PLANTILLAS_KEY = "nf_plantillas_custom";

type PlantillaGuardada = {
  email: Record<string, { asunto: string; cuerpo: string }>;
  wa: Record<string, string>;
};

export function getPlantillasCustom(): PlantillaGuardada {
  return getItem<PlantillaGuardada>(PLANTILLAS_KEY, { email: {}, wa: {} });
}

export function savePlantillaEmail(segmento: string, asunto: string, cuerpo: string) {
  const data = getPlantillasCustom();
  data.email[segmento] = { asunto, cuerpo };
  setItem(PLANTILLAS_KEY, data);
}

export function savePlantillaWA(segmento: string, mensaje: string) {
  const data = getPlantillasCustom();
  data.wa[segmento] = mensaje;
  setItem(PLANTILLAS_KEY, data);
}

export function getResumen() {
  const contactos = getContactos();
  const citas = getCitas();
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
