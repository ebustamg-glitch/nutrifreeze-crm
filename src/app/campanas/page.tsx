"use client";
import { useState, useEffect } from "react";
import { getContactos, addActividad, updateContacto, getCampaignTemplates, saveCampaignTemplate } from "@/lib/store";
import { Contacto, SEGMENTOS, Segmento } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageCircle, Send, CheckCircle, Filter, Save } from "lucide-react";

const PLANTILLAS_EMAIL: Record<Segmento | "todos", { asunto: string; cuerpo: string }> = {
  todos: {
    asunto: "NutriFreeze — Alimentos saludables para tu negocio",
    cuerpo: `Hola,

Le contactamos de NutriFreeze, empresa especializada en alimentos saludables congelados de alta calidad.

Ofrecemos una solución práctica y nutritiva que puede complementar perfectamente su negocio.

¿Le gustaría conocer más sobre nuestros productos? Con gusto agendamos una visita o demostración sin compromiso.

Saludos,
Equipo NutriFreeze
📞 [Tu teléfono]
🌐 nutrifreeze.co`,
  },
  restaurante: {
    asunto: "NutriFreeze — Ingredientes saludables para tu restaurante",
    cuerpo: `Estimado equipo,

Somos NutriFreeze, especialistas en alimentos congelados saludables de alta calidad para el sector restaurantero.

Nuestros productos te permiten ofrecer opciones nutritivas a tus clientes con la practicidad del congelado, sin sacrificar sabor ni calidad.

✅ Entrega a domicilio en CDMX
✅ Precios de mayoreo
✅ Muestras sin costo disponibles

¿Les gustaría recibir una muestra gratuita? Escríbanos o llámenos para coordinar.

Saludos,
Equipo NutriFreeze`,
  },
  corporativo: {
    asunto: "NutriFreeze — Beneficio de salud para tus empleados",
    cuerpo: `Estimado equipo de RH / Bienestar,

En NutriFreeze ayudamos a empresas como la suya a ofrecer un beneficio diferenciador: alimentos saludables y nutritivos para sus colaboradores.

Contamos con planes corporativos que incluyen:
✅ Snacks y comidas saludables congeladas
✅ Entrega semanal a sus instalaciones
✅ Facturación corporativa
✅ Descuentos por volumen

Ideal para comedor de empresa, vending saludable o canasta de beneficios.

¿Podemos agendar 20 minutos para presentarles la propuesta?

Saludos,
Equipo NutriFreeze`,
  },
  coworking: {
    asunto: "NutriFreeze — Snacks saludables para tu coworking",
    cuerpo: `Hola,

Somos NutriFreeze y queremos ayudarles a ofrecer una opción diferente a sus miembros: alimentos saludables y prácticos disponibles en su espacio.

Un coworking con NutriFreeze es un coworking que cuida a su comunidad.

✅ Surtido semanal de productos saludables
✅ Sin inversión inicial — solo pagan lo que venden
✅ Aumenta el valor percibido de tu espacio

¿Les interesa conocer la propuesta?

Saludos,
Equipo NutriFreeze`,
  },
  gimnasio: {
    asunto: "NutriFreeze — Nutrición deportiva para tus clientes",
    cuerpo: `Hola,

En NutriFreeze tenemos la solución perfecta para los gimnasios que quieren ofrecer más a sus clientes: alimentos saludables y nutritivos listos para consumir.

✅ Proteínas, smoothies y snacks saludables congelados
✅ Complemento perfecto para post-entreno
✅ Punto de venta en tu establecimiento

Aumenta tus ingresos y la satisfacción de tus clientes.

¿Agendamos una visita?

Saludos,
Equipo NutriFreeze`,
  },
  fundacion: {
    asunto: "NutriFreeze — Alimentación saludable para tu fundación",
    cuerpo: `Estimado equipo,

En NutriFreeze creemos en el poder de la nutrición para transformar vidas. Por eso contamos con programas especiales para fundaciones y organizaciones sociales.

Podemos apoyarles con:
✅ Alimentos saludables a precio social
✅ Donaciones y alianzas estratégicas
✅ Talleres de nutrición

¿Podemos platicar sobre cómo colaborar?

Saludos,
Equipo NutriFreeze`,
  },
  hotel: {
    asunto: "NutriFreeze — Opciones saludables para tus huéspedes",
    cuerpo: `Estimado equipo,

Somos NutriFreeze y queremos ayudar a su hotel a ofrecer opciones de alimentación saludable de alta calidad para sus huéspedes.

✅ Desayunos y snacks saludables congelados
✅ Opción de minibares saludables
✅ Entrega programada a sus instalaciones

¿Les gustaría conocer nuestra propuesta?

Saludos,
Equipo NutriFreeze`,
  },
  clinica: {
    asunto: "NutriFreeze — Nutrición clínica de calidad",
    cuerpo: `Estimado equipo médico,

En NutriFreeze desarrollamos alimentos pensados para pacientes que requieren una alimentación controlada y nutritiva.

✅ Opciones bajas en sodio, azúcar y grasa
✅ Ideales para recomendación profesional
✅ Empaque con información nutricional completa

¿Les gustaría recibir muestras para evaluación clínica?

Saludos,
Equipo NutriFreeze`,
  },
  otro: {
    asunto: "NutriFreeze — Alimentos saludables para tu negocio",
    cuerpo: `Hola,

Somos NutriFreeze, especialistas en alimentos saludables congelados.

Nos gustaría presentarles nuestra propuesta y explorar cómo podemos trabajar juntos.

¿Tienen unos minutos esta semana?

Saludos,
Equipo NutriFreeze`,
  },
};

const PLANTILLAS_WHATSAPP: Record<Segmento | "todos", string> = {
  todos: "Hola! 👋 Te contactamos de *NutriFreeze*, especialistas en alimentos saludables congelados para negocios en CDMX. ¿Te gustaría conocer nuestros productos? 🥗❄️",
  restaurante: "Hola! 👋 Somos *NutriFreeze*, alimentos saludables congelados de calidad para restaurantes. Trabajamos con entregas en CDMX y tenemos muestras sin costo. ¿Te interesa? 🍽️",
  corporativo: "Hola! 👋 Somos *NutriFreeze*. Ayudamos a empresas a ofrecer alimentos saludables como beneficio para sus empleados. ¿Les gustaría conocer nuestros planes corporativos? 🏢✅",
  coworking: "Hola! 👋 Somos *NutriFreeze*. Tenemos una propuesta especial para coworkings: snacks y alimentos saludables para tu comunidad, sin inversión inicial. ¿Platicamos? 💼🥗",
  gimnasio: "Hola! 👋 Somos *NutriFreeze*, alimentos saludables perfectos para post-entreno. Podemos colocar un punto de venta en tu gym sin costo inicial. ¿Te interesa? 💪❄️",
  fundacion: "Hola! 👋 Somos *NutriFreeze* y tenemos programas de alimentación saludable para fundaciones y OSC. Nos gustaría platicar sobre cómo colaborar. ¿Tienen unos minutos? 🤝",
  hotel: "Hola! 👋 Somos *NutriFreeze*, alimentos saludables para hoteles. Opciones de desayuno y snacks de calidad para sus huéspedes. ¿Les interesa conocer la propuesta? 🏨",
  clinica: "Hola! 👋 Somos *NutriFreeze*, alimentos con control nutricional ideales para pacientes. ¿Les gustaría recibir muestras para evaluación? 🏥🥗",
  otro: "Hola! 👋 Te contactamos de *NutriFreeze*, alimentos saludables congelados. ¿Tienes unos minutos para conocer nuestra propuesta? 😊",
};

function nanoidSimple() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Campanas() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [segmentoFiltro, setSegmentoFiltro] = useState<Segmento | "todos">("todos");
  const [asunto, setAsunto] = useState(PLANTILLAS_EMAIL["todos"].asunto);
  const [cuerpo, setCuerpo] = useState(PLANTILLAS_EMAIL["todos"].cuerpo);
  const [mensajeWA, setMensajeWA] = useState(PLANTILLAS_WHATSAPP["todos"]);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  const [guardadoEmail, setGuardadoEmail] = useState(false);
  const [guardadoWA, setGuardadoWA] = useState(false);

  useEffect(() => {
    (async () => {
      setContactos(await getContactos());
      const custom = await getCampaignTemplates();
      setAsunto(custom["todos"]?.email?.asunto ?? PLANTILLAS_EMAIL["todos"].asunto);
      setCuerpo(custom["todos"]?.email?.cuerpo ?? PLANTILLAS_EMAIL["todos"].cuerpo);
      setMensajeWA(custom["todos"]?.wa?.cuerpo ?? PLANTILLAS_WHATSAPP["todos"]);
    })();
  }, []);

  async function aplicarPlantilla(seg: Segmento | "todos") {
    setSegmentoFiltro(seg);
    setGuardadoEmail(false);
    setGuardadoWA(false);
    const custom = await getCampaignTemplates();
    setAsunto(custom[seg]?.email?.asunto ?? PLANTILLAS_EMAIL[seg].asunto);
    setCuerpo(custom[seg]?.email?.cuerpo ?? PLANTILLAS_EMAIL[seg].cuerpo);
    setMensajeWA(custom[seg]?.wa?.cuerpo ?? PLANTILLAS_WHATSAPP[seg]);
  }

  async function guardarEmail() {
    await saveCampaignTemplate(segmentoFiltro, "email", asunto, cuerpo);
    setGuardadoEmail(true);
    setTimeout(() => setGuardadoEmail(false), 2000);
  }

  async function guardarWA() {
    await saveCampaignTemplate(segmentoFiltro, "wa", undefined, mensajeWA);
    setGuardadoWA(true);
    setTimeout(() => setGuardadoWA(false), 2000);
  }

  const destinatarios = contactos.filter((c) => {
    if (segmentoFiltro === "todos") return true;
    return c.segmento === segmentoFiltro;
  });

  const conEmail = destinatarios.filter((c) => c.email);
  const conWhatsApp = destinatarios.filter((c) => c.telefono);

  async function registrarEnvioEmail(c: Contacto) {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: c.email, subject: asunto, body: cuerpo }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      alert(`Error al enviar: ${error}`);
      return;
    }
    await addActividad({
      id: nanoidSimple(),
      contacto_id: c.id,
      tipo: "email",
      descripcion: `Campaña: ${asunto}`,
      fecha: new Date().toISOString(),
      estado_email: "enviado",
      usuario: "dueno",
    });
    await updateContacto(c.id, {
      etapa: c.etapa === "nuevo" ? "contactado" : c.etapa,
      fecha_ultimo_contacto: new Date().toISOString(),
    });
    setEnviados((prev) => new Set(prev).add(c.id));
    setContactos(await getContactos());
  }

  async function abrirWhatsApp(c: Contacto) {
    const tel = c.telefono!.replace(/\D/g, "");
    const msg = encodeURIComponent(mensajeWA);
    window.open(`https://wa.me/52${tel}?text=${msg}`, "_blank");
    await addActividad({
      id: nanoidSimple(),
      contacto_id: c.id,
      tipo: "whatsapp",
      descripcion: mensajeWA,
      fecha: new Date().toISOString(),
      estado_whatsapp: "enviado",
      usuario: "dueno",
    });
    await updateContacto(c.id, {
      etapa: c.etapa === "nuevo" ? "contactado" : c.etapa,
      fecha_ultimo_contacto: new Date().toISOString(),
    });
    setEnviados((prev) => new Set(prev).add(`wa_${c.id}`));
    setContactos(await getContactos());
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Campañas de Outreach</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Envía emails y WhatsApp personalizados por segmento
        </p>
      </div>

      {/* Selector de segmento */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Segmento objetivo:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => aplicarPlantilla("todos")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  segmentoFiltro === "todos" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos ({contactos.length})
              </button>
              {SEGMENTOS.map((s) => {
                const n = contactos.filter((c) => c.segmento === s.value).length;
                if (n === 0) return null;
                return (
                  <button
                    key={s.value}
                    onClick={() => aplicarPlantilla(s.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      segmentoFiltro === s.value ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s.icono} {s.label} ({n})
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="email">
        <TabsList className="mb-4">
          <TabsTrigger value="email">
            <Mail size={15} className="mr-2" /> Email ({conEmail.length} contactos)
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageCircle size={15} className="mr-2" /> WhatsApp ({conWhatsApp.length} contactos)
          </TabsTrigger>
        </TabsList>

        {/* TAB EMAIL */}
        <TabsContent value="email">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plantilla de email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Asunto</label>
                  <Input value={asunto} onChange={(e) => setAsunto(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Cuerpo del mensaje</label>
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm resize-none h-64 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={cuerpo}
                    onChange={(e) => setCuerpo(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={guardarEmail}
                  className={guardadoEmail ? "bg-green-600 hover:bg-green-600" : "bg-slate-700 hover:bg-slate-800"}
                >
                  <Save size={14} className="mr-1.5" />
                  {guardadoEmail ? "¡Guardado!" : "Guardar plantilla"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Destinatarios con email ({conEmail.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {conEmail.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                      No hay contactos con email en este segmento
                    </p>
                  ) : (
                    conEmail.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{c.nombre_negocio}</p>
                          <p className="text-xs text-slate-500 truncate">{c.email}</p>
                        </div>
                        {enviados.has(c.id) ? (
                          <Badge className="bg-green-100 text-green-700 shrink-0 text-xs">
                            <CheckCircle size={12} className="mr-1" /> Enviado
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 shrink-0"
                            onClick={() => registrarEnvioEmail(c)}
                          >
                            <Send size={12} className="mr-1" /> Enviar
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB WHATSAPP */}
        <TabsContent value="whatsapp">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mensaje de WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="text-xs font-medium text-slate-600 block mb-1">Mensaje</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm resize-none h-48 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  value={mensajeWA}
                  onChange={(e) => setMensajeWA(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-2">
                  * Se abrirá WhatsApp Web por cada contacto. Registra la actividad automáticamente.
                </p>
                <Button
                  size="sm"
                  onClick={guardarWA}
                  className={guardadoWA ? "bg-green-600 hover:bg-green-600" : "bg-slate-700 hover:bg-slate-800"}
                >
                  <Save size={14} className="mr-1.5" />
                  {guardadoWA ? "¡Guardado!" : "Guardar plantilla"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contactos con teléfono ({conWhatsApp.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {conWhatsApp.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                      No hay contactos con teléfono en este segmento
                    </p>
                  ) : (
                    conWhatsApp.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{c.nombre_negocio}</p>
                          <p className="text-xs text-slate-500">{c.telefono}</p>
                        </div>
                        {enviados.has(`wa_${c.id}`) ? (
                          <Badge className="bg-green-100 text-green-700 shrink-0 text-xs">
                            <CheckCircle size={12} className="mr-1" /> Enviado
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700 shrink-0"
                            onClick={() => abrirWhatsApp(c)}
                          >
                            <MessageCircle size={12} className="mr-1" /> Enviar
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
