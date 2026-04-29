"use client";
import { useState, useEffect } from "react";
import { getContactos, updateContacto, deleteContacto, addActividad } from "@/lib/store";
import { Contacto, SEGMENTOS, ETAPAS_CRM, EtapaCRM } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Phone, Mail, Globe, MapPin, Trash2, Edit2, MessageCircle,
  Send, Calendar, ChevronDown, Search, Users
} from "lucide-react";
import { nanoid } from "nanoid";

function nanoidSimple() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Contactos() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [filtro, setFiltro] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("todos");
  const [filtroSegmento, setFiltroSegmento] = useState("todos");
  const [editando, setEditando] = useState<Contacto | null>(null);
  const [accion, setAccion] = useState<{ contacto: Contacto; tipo: "email" | "whatsapp" | "nota" } | null>(null);
  const [mensajeAccion, setMensajeAccion] = useState("");

  useEffect(() => { setContactos(getContactos()); }, []);

  function refrescar() { setContactos(getContactos()); }

  const filtrados = contactos.filter((c) => {
    const texto = filtro.toLowerCase();
    const matchTexto =
      !filtro ||
      c.nombre_negocio.toLowerCase().includes(texto) ||
      c.alcaldia.toLowerCase().includes(texto) ||
      (c.telefono ?? "").includes(texto);
    const matchEtapa = filtroEtapa === "todos" || c.etapa === filtroEtapa;
    const matchSeg = filtroSegmento === "todos" || c.segmento === filtroSegmento;
    return matchTexto && matchEtapa && matchSeg;
  });

  function cambiarEtapa(id: string, etapa: EtapaCRM) {
    updateContacto(id, { etapa, fecha_ultimo_contacto: new Date().toISOString() });
    refrescar();
  }

  function eliminar(id: string) {
    if (confirm("¿Eliminar este contacto?")) {
      deleteContacto(id);
      refrescar();
    }
  }

  function guardarEdicion() {
    if (!editando) return;
    updateContacto(editando.id, editando);
    setEditando(null);
    refrescar();
  }

  function registrarAccion() {
    if (!accion || !mensajeAccion.trim()) return;
    addActividad({
      id: nanoidSimple(),
      contacto_id: accion.contacto.id,
      tipo: accion.tipo,
      descripcion: mensajeAccion,
      fecha: new Date().toISOString(),
      usuario: "dueno",
      ...(accion.tipo === "email" ? { estado_email: "enviado" } : {}),
      ...(accion.tipo === "whatsapp" ? { estado_whatsapp: "enviado" } : {}),
    });
    updateContacto(accion.contacto.id, {
      etapa: accion.contacto.etapa === "nuevo" ? "contactado" : accion.contacto.etapa,
      fecha_ultimo_contacto: new Date().toISOString(),
    });
    setAccion(null);
    setMensajeAccion("");
    refrescar();
  }

  const etapaStyle = (e: EtapaCRM) =>
    ETAPAS_CRM.find((et) => et.value === e)?.color ?? "bg-slate-100 text-slate-700";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contactos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{contactos.length} contactos en tu base de datos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, alcaldía, teléfono..."
            className="pl-9"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        <Select value={filtroEtapa} onValueChange={(v) => setFiltroEtapa(v ?? "todos")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las etapas</SelectItem>
            {ETAPAS_CRM.map((e) => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroSegmento} onValueChange={(v) => setFiltroSegmento(v ?? "todos")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los segmentos</SelectItem>
            {SEGMENTOS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.icono} {s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay contactos aún</p>
          <p className="text-sm mt-1">Ve a Buscar Leads para importar contactos del DENUE</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{c.nombre_negocio}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${etapaStyle(c.etapa)}`}>
                        {ETAPAS_CRM.find((e) => e.value === c.etapa)?.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {SEGMENTOS.find((s) => s.value === c.segmento)?.icono}{" "}
                        {SEGMENTOS.find((s) => s.value === c.segmento)?.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
                      {c.telefono && <span className="flex items-center gap-1"><Phone size={12} /> {c.telefono}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail size={12} /> {c.email}</span>}
                      {c.sitio_web && <span className="flex items-center gap-1"><Globe size={12} /> {c.sitio_web}</span>}
                      <span className="flex items-center gap-1"><MapPin size={12} /> {c.alcaldia}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Cambiar etapa */}
                    <Select value={c.etapa} onValueChange={(v) => cambiarEtapa(c.id, v as EtapaCRM)}>
                      <SelectTrigger className="h-8 text-xs w-36 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ETAPAS_CRM.map((e) => (
                          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {c.telefono && (
                      <Button
                        size="sm" variant="outline"
                        className="h-8 w-8 p-0 text-green-600"
                        title="WhatsApp"
                        onClick={() => setAccion({ contacto: c, tipo: "whatsapp" })}
                      >
                        <MessageCircle size={14} />
                      </Button>
                    )}
                    {c.email && (
                      <Button
                        size="sm" variant="outline"
                        className="h-8 w-8 p-0 text-blue-600"
                        title="Email"
                        onClick={() => setAccion({ contacto: c, tipo: "email" })}
                      >
                        <Send size={14} />
                      </Button>
                    )}
                    <Button
                      size="sm" variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditando({ ...c })}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => eliminar(c.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal editar contacto */}
      <Dialog open={!!editando} onOpenChange={() => setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-3">
              {(["nombre_negocio", "nombre_contacto", "telefono", "email", "sitio_web", "notas"] as const).map((campo) => (
                <div key={campo}>
                  <label className="text-xs font-medium text-slate-600 capitalize block mb-1">
                    {campo.replace("_", " ")}
                  </label>
                  <Input
                    value={(editando[campo] as string) ?? ""}
                    onChange={(e) => setEditando({ ...editando, [campo]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
                <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={guardarEdicion}>Guardar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal acción email/whatsapp */}
      <Dialog open={!!accion} onOpenChange={() => setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {accion?.tipo === "whatsapp" ? "📱 Registrar WhatsApp" : "📧 Registrar Email"} — {accion?.contacto.nombre_negocio}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {accion?.tipo === "whatsapp" && accion.contacto.telefono && (
              <a
                href={`https://wa.me/52${accion.contacto.telefono.replace(/\D/g, "")}?text=Hola,%20le%20contactamos%20de%20NutriFreeze`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
              >
                Abrir WhatsApp →
              </a>
            )}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Notas del mensaje enviado</label>
              <textarea
                className="w-full border rounded-lg p-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Escribe el mensaje o notas del contacto..."
                value={mensajeAccion}
                onChange={(e) => setMensajeAccion(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
              <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={registrarAccion}>
                Registrar actividad
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
