import { Contacto, Segmento, GIROS_DENUE } from "./types";

// Estructura real del API Buscar del DENUE INEGI
interface DenueEstablecimiento {
  Id: string;
  Nombre: string;
  Razon_social?: string;
  Clase_actividad: string;
  CLEE?: string;
  Estrato: string;
  Tipo_vialidad?: string;
  Calle: string;
  Num_Exterior: string;
  Num_Interior?: string;
  Colonia: string;
  CP?: string;
  Ubicacion: string;
  Telefono: string;
  Correo_e: string;
  Sitio_internet: string;
  Latitud: string;
  Longitud: string;
  _demo?: boolean;
}

function inferirSegmento(claseActividad: string, clee?: string): Segmento {
  const texto = (claseActividad + " " + (clee ?? "")).toLowerCase();
  if (texto.includes("restaurante") || texto.includes("comida") || texto.includes("taqueria") || texto.includes("bar")) return "restaurante";
  if (texto.includes("corporativo") || texto.includes("empresa") || texto.includes("administracion")) return "corporativo";
  if (texto.includes("coworking") || texto.includes("oficina") || texto.includes("espacio compartido")) return "coworking";
  if (texto.includes("gimnasio") || texto.includes("fitness") || texto.includes("deportivo")) return "gimnasio";
  if (texto.includes("fundacion") || texto.includes("asociacion") || texto.includes("civil")) return "fundacion";
  if (texto.includes("hotel") || texto.includes("hospedaje") || texto.includes("motel")) return "hotel";
  if (texto.includes("clinica") || texto.includes("consultorio") || texto.includes("medico") || texto.includes("salud")) return "clinica";
  // Inferir por código CLEE (posición 5-7 es actividad SCIAN)
  if (clee) {
    const match = GIROS_DENUE.find((g) => clee.slice(5).startsWith(g.codigo));
    if (match) return match.segmento;
  }
  return "otro";
}

function calcularScore(est: DenueEstablecimiento): number {
  let score = 40;
  if (est.Telefono && est.Telefono !== "0" && est.Telefono.trim() !== "") score += 25;
  if (est.Correo_e && est.Correo_e !== "0" && est.Correo_e.trim() !== "") score += 20;
  if (est.Sitio_internet && est.Sitio_internet !== "0" && est.Sitio_internet.trim() !== "") score += 15;
  return Math.min(score, 100);
}

function parsearAlcaldia(ubicacion: string): string {
  // Ubicacion formato: "COLONIA, Alcaldía, CIUDAD DE MÉXICO"
  const partes = ubicacion.split(",");
  return partes[1]?.trim() ?? ubicacion;
}

function mapearContacto(est: DenueEstablecimiento): Contacto {
  const direccion = [est.Calle, est.Num_Exterior, est.Colonia].filter(Boolean).join(" ");
  const alcaldia = parsearAlcaldia(est.Ubicacion);

  return {
    id: `denue_${est.Id}`,
    nombre_negocio: est.Nombre || est.Razon_social || "Sin nombre",
    telefono: est.Telefono?.trim() && est.Telefono !== "0" ? est.Telefono.trim() : undefined,
    email: est.Correo_e?.trim() && est.Correo_e !== "0" ? est.Correo_e.trim() : undefined,
    sitio_web: est.Sitio_internet?.trim() && est.Sitio_internet !== "0" ? est.Sitio_internet.trim() : undefined,
    direccion,
    alcaldia,
    colonia: est.Colonia,
    segmento: inferirSegmento(est.Clase_actividad, est.CLEE),
    giro_denue: est.Clase_actividad,
    empleados_rango: est.Estrato,
    etapa: "nuevo",
    score: calcularScore(est),
    fuente: "denue",
    fecha_creacion: new Date().toISOString(),
    asignado_a: "dueno",
  };
}

export async function buscarLeadsDenue(
  alcaldia: string,
  codigoActividad: string,
  pagina: number = 1
): Promise<{ contactos: Contacto[]; total: number; error?: string; demo?: boolean }> {
  try {
    const params = new URLSearchParams({
      alcaldia,
      actividad: codigoActividad,
      pagina: String(pagina),
    });

    const res = await fetch(`/api/denue?${params}`);
    const data = await res.json();

    if (!res.ok) {
      return { contactos: [], total: 0, error: data.error ?? `Error ${res.status}` };
    }

    if (!Array.isArray(data)) {
      return { contactos: [], total: 0, error: "Sin resultados para esta búsqueda" };
    }

    const isDemo = res.headers.get("X-Demo-Mode") === "true";
    const totalHeader = res.headers.get("X-Total-Count");
    const total = totalHeader ? parseInt(totalHeader) : data.length;
    const contactos = (data as DenueEstablecimiento[]).map(mapearContacto);
    return { contactos, total, demo: isDemo };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { contactos: [], total: 0, error: msg };
  }
}
