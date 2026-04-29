"use client";
import { useState, useEffect } from "react";
import { getContactos, getCitas, saveCita, deleteCita } from "@/lib/store";
import { Contacto, Cita } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Plus, CheckCircle, Trash2, Phone, MessageCircle } from "lucide-react";

function nanoidSimple() { return Math.random().toString(36).slice(2, 10); }

const RESULTADO_COLORS: Record<string, string> = {
  interesado: "bg-green-100 text-green-700",
  no_interesado: "bg-red-100 text-red-700",
  pendiente: "bg-yellow-100 text-yellow-700",
  reagendar: "bg-orange-100 text-orange-700",
};

export default function Agenda() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [modal, setModal] = useState(false);
  const [resultadoModal, setResultadoModal] = useState<Cita | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "pendientes" | "hoy" | "completadas">("pendientes");
  const [form, setForm] = useState<Partial<Cita>>({ tipo: "visita", asignado_a: "dueno", completada: false });

  useEffect(() => {
    (async () => {
      setCitas(await getCitas());
      setContactos(await getContactos());
    })();
  }, []);

  async function refrescar() { setCitas(await getCitas()); }

  function abrirNueva() {
    setForm({ tipo: "visita", asignado_a: "dueno", completada: false });
    setModal(true);
  }

  async function guardarCita() {
    if (!form.contacto_id || !form.fecha || !form.hora) return;
    const contacto = contactos.find((c) => c.id === form.contacto_id);
    const cita: Cita = {
      id: form.id ?? nanoidSimple(),
      contacto_id: form.contacto_id!,
      contacto_nombre: contacto?.nombre_negocio ?? "",
      tipo: form.tipo as Cita["tipo"],
      fecha: form.fecha!,
      hora: form.hora!,
      direccion: form.direccion ?? contacto?.direccion,
      notas: form.notas,
      asignado_a: form.asignado_a as Cita["asignado_a"],
      completada: false,
    };
    await saveCita(cita);
    setModal(false);
    await refrescar();
  }

  function marcarCompletada(cita: Cita) { setResultadoModal({ ...cita }); }

  async function guardarResultado() {
    if (!resultadoModal) return;
    await saveCita({ ...resultadoModal, completada: true });
    setResultadoModal(null);
    await refrescar();
  }

  async function eliminar(id: string) {
    if (confirm("¿Eliminar esta cita?")) {
      await deleteCita(id);
      await refrescar();
    }
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const citasFiltradas = citas.filter((c) => {
    if (filtro === "pendientes") return !c.completada;
    if (filtro === "hoy") return !c.completada && c.fecha === hoy;
    if (filtro === "completadas") return c.completada;
    return true;
  }).sort((a, b) => `${a.fecha}${a.hora}` > `${b.fecha}${b.hora}` ? 1 : -1);

  const pendientesHoy = citas.filter((c) => !c.completada && c.fecha === hoy).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda de Citas</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pendientesHoy > 0 ? `Tienes ${pendientesHoy} cita(s) hoy` : "Sin citas para hoy"}
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={abrirNueva}>
          <Plus size={16} className="mr-2" /> Nueva cita
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Hoy", value: citas.filter((c) => !c.completada && c.fecha === hoy).length, color: "text-purple-600" },
          { label: "Pendientes", value: citas.filter((c) => !c.completada).length, color: "text-yellow-600" },
          { label: "Completadas", value: citas.filter((c) => c.completada).length, color: "text-green-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {(["todas", "hoy", "pendientes", "completadas"] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${filtro === f ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {f === "hoy" ? "Hoy" : f === "pendientes" ? "Pendientes" : f === "completadas" ? "Completadas" : "Todas"}
          </button>
        ))}
      </div>

      {citasFiltradas.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay citas en esta vista</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citasFiltradas.map((cita) => {
            const contacto = contactos.find((c) => c.id === cita.contacto_id);
            const esHoy = cita.fecha === hoy;
            return (
              <Card key={cita.id} className={`${cita.completada ? "opacity-60" : ""} ${esHoy && !cita.completada ? "ring-2 ring-purple-400" : ""}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{cita.contacto_nombre}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {cita.tipo === "visita" ? "🚗 Visita" : cita.tipo === "videollamada" ? "💻 Videollamada" : "📞 Llamada"}
                        </Badge>
                        {esHoy && !cita.completada && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">HOY</span>}
                        {cita.completada && cita.resultado && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RESULTADO_COLORS[cita.resultado] ?? ""}`}>
                            {cita.resultado.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(cita.fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {cita.hora}</span>
                        {cita.direccion && <span className="flex items-center gap-1 truncate"><MapPin size={12} /> {cita.direccion}</span>}
                      </div>
                      {cita.notas && <p className="text-xs text-slate-500 mt-1 italic">{cita.notas}</p>}
                      {contacto && !cita.completada && (
                        <div className="flex gap-2 mt-2">
                          {contacto.telefono && (
                            <a href={`https://wa.me/52${contacto.telefono.replace(/\D/g, "")}?text=Hola!%20Le%20recordamos%20nuestra%20cita%20a%20las%20${cita.hora}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                              <MessageCircle size={12} /> Recordatorio WA
                            </a>
                          )}
                          {contacto.telefono && (
                            <a href={`tel:${contacto.telefono}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                              <Phone size={12} /> Llamar
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!cita.completada && (
                        <Button size="sm" variant="outline" className="h-8 text-xs text-green-600 border-green-200" onClick={() => marcarCompletada(cita)}>
                          <CheckCircle size={13} className="mr-1" /> Completar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500" onClick={() => eliminar(cita.id)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva cita / visita</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Contacto</label>
              <Select value={form.contacto_id ?? ""} onValueChange={(v) => setForm({ ...form, contacto_id: v || undefined })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar contacto..." /></SelectTrigger>
                <SelectContent>
                  {contactos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre_negocio}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
                <Select value={form.tipo ?? "visita"} onValueChange={(v) => setForm({ ...form, tipo: v as Cita["tipo"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visita">🚗 Visita presencial</SelectItem>
                    <SelectItem value="videollamada">💻 Videollamada</SelectItem>
                    <SelectItem value="llamada">📞 Llamada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Asignado a</label>
                <Select value={form.asignado_a ?? "dueno"} onValueChange={(v) => setForm({ ...form, asignado_a: v as Cita["asignado_a"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueno">👤 Dueño</SelectItem>
                    <SelectItem value="vendedor">👥 Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Fecha</label>
                <Input type="date" value={form.fecha ?? ""} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Hora</label>
                <Input type="time" value={form.hora ?? ""} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Dirección (opcional)</label>
              <Input placeholder="Dirección de la visita..." value={form.direccion ?? ""} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Notas</label>
              <Input placeholder="Notas previas..." value={form.notas ?? ""} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
              <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={guardarCita} disabled={!form.contacto_id || !form.fecha || !form.hora}>
                Agendar cita
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resultadoModal} onOpenChange={() => setResultadoModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resultado — {resultadoModal?.contacto_nombre}</DialogTitle></DialogHeader>
          {resultadoModal && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Resultado</label>
                <Select value={resultadoModal.resultado ?? "pendiente"} onValueChange={(v) => setResultadoModal({ ...resultadoModal, resultado: v as Cita["resultado"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interesado">✅ Interesado</SelectItem>
                    <SelectItem value="no_interesado">❌ No interesado</SelectItem>
                    <SelectItem value="pendiente">⏳ Pendiente respuesta</SelectItem>
                    <SelectItem value="reagendar">🔄 Reagendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Notas de la visita</label>
                <textarea className="w-full border rounded-lg p-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="¿Qué pasó? ¿Próximo paso?"
                  value={resultadoModal.notas ?? ""} onChange={(e) => setResultadoModal({ ...resultadoModal, notas: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setResultadoModal(null)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={guardarResultado}>
                  <CheckCircle size={15} className="mr-1" /> Marcar completada
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
