export type Segmento =
  | "restaurante"
  | "corporativo"
  | "coworking"
  | "gimnasio"
  | "fundacion"
  | "hotel"
  | "clinica"
  | "otro";

export type EtapaCRM =
  | "nuevo"
  | "contactado"
  | "interesado"
  | "cita_agendada"
  | "visitado"
  | "cerrado"
  | "descartado";

export type CanalContacto = "email" | "whatsapp" | "llamada" | "visita";

export type EstadoEmail = "pendiente" | "enviado" | "entregado" | "abierto" | "click" | "respondio";
export type EstadoWhatsApp = "pendiente" | "enviado" | "entregado" | "leido" | "respondio";

export interface Contacto {
  id: string;
  nombre_negocio: string;
  nombre_contacto?: string;
  telefono?: string;
  email?: string;
  sitio_web?: string;
  direccion: string;
  alcaldia: string;
  colonia?: string;
  segmento: Segmento;
  giro_denue?: string;
  empleados_rango?: string;
  etapa: EtapaCRM;
  score: number; // 1-100
  notas?: string;
  fuente: "denue" | "google_maps" | "manual";
  fecha_creacion: string;
  fecha_ultimo_contacto?: string;
  asignado_a?: "dueno" | "vendedor";
}

export interface Actividad {
  id: string;
  contacto_id: string;
  tipo: CanalContacto | "nota";
  descripcion: string;
  fecha: string;
  estado_email?: EstadoEmail;
  estado_whatsapp?: EstadoWhatsApp;
  usuario: "dueno" | "vendedor";
}

export interface Cita {
  id: string;
  contacto_id: string;
  contacto_nombre: string;
  tipo: "visita" | "videollamada" | "llamada";
  fecha: string;
  hora: string;
  direccion?: string;
  notas?: string;
  asignado_a: "dueno" | "vendedor";
  resultado?: "interesado" | "no_interesado" | "pendiente" | "reagendar";
  completada: boolean;
}

export type Alcaldia =
  | "Álvaro Obregón"
  | "Azcapotzalco"
  | "Benito Juárez"
  | "Coyoacán"
  | "Cuajimalpa"
  | "Cuauhtémoc"
  | "Gustavo A. Madero"
  | "Iztacalco"
  | "Iztapalapa"
  | "La Magdalena Contreras"
  | "Miguel Hidalgo"
  | "Milpa Alta"
  | "Tláhuac"
  | "Tlalpan"
  | "Venustiano Carranza"
  | "Xochimilco";

export const ALCALDIAS: Alcaldia[] = [
  "Miguel Hidalgo",
  "Benito Juárez",
  "Cuauhtémoc",
  "Cuajimalpa",
  "Álvaro Obregón",
  "Coyoacán",
  "Azcapotzalco",
  "Tlalpan",
  "Gustavo A. Madero",
  "Iztapalapa",
  "Iztacalco",
  "Venustiano Carranza",
  "Tláhuac",
  "Xochimilco",
  "La Magdalena Contreras",
  "Milpa Alta",
];

export const SEGMENTOS: { value: Segmento; label: string; icono: string }[] = [
  { value: "restaurante", label: "Restaurante / Dark Kitchen", icono: "🍽️" },
  { value: "corporativo", label: "Corporativo / Empresa", icono: "🏢" },
  { value: "coworking", label: "Coworking / Oficina Virtual", icono: "💼" },
  { value: "gimnasio", label: "Gimnasio / Centro Fitness", icono: "💪" },
  { value: "fundacion", label: "Fundación / OSC", icono: "🤝" },
  { value: "hotel", label: "Hotel Boutique", icono: "🏨" },
  { value: "clinica", label: "Clínica / Hospital", icono: "🏥" },
  { value: "otro", label: "Otro", icono: "📌" },
];

export const ETAPAS_CRM: { value: EtapaCRM; label: string; color: string }[] = [
  { value: "nuevo", label: "Nuevo", color: "bg-slate-100 text-slate-700" },
  { value: "contactado", label: "Contactado", color: "bg-blue-100 text-blue-700" },
  { value: "interesado", label: "Interesado", color: "bg-yellow-100 text-yellow-700" },
  { value: "cita_agendada", label: "Cita Agendada", color: "bg-purple-100 text-purple-700" },
  { value: "visitado", label: "Visitado", color: "bg-orange-100 text-orange-700" },
  { value: "cerrado", label: "Cerrado ✓", color: "bg-green-100 text-green-700" },
  { value: "descartado", label: "Descartado", color: "bg-red-100 text-red-700" },
];

export const GIROS_DENUE: { codigo: string; label: string; segmento: Segmento }[] = [
  { codigo: "722", label: "Restaurantes y servicios de comida", segmento: "restaurante" },
  { codigo: "7224", label: "Bares, cantinas y similares", segmento: "restaurante" },
  { codigo: "7223", label: "Servicios de comida para llevar", segmento: "restaurante" },
  { codigo: "931", label: "Corporativos", segmento: "corporativo" },
  { codigo: "5611", label: "Servicios de administración empresarial", segmento: "corporativo" },
  { codigo: "5321", label: "Alquiler de espacios de oficinas", segmento: "coworking" },
  { codigo: "7139", label: "Gimnasios y centros deportivos", segmento: "gimnasio" },
  { codigo: "8133", label: "Fundaciones y asociaciones civiles", segmento: "fundacion" },
  { codigo: "7211", label: "Hoteles con otros servicios", segmento: "hotel" },
  { codigo: "621", label: "Consultorios y clínicas", segmento: "clinica" },
];
