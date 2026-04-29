"use client";
import { useState, useEffect } from "react";
import { getContactos, updateContacto } from "@/lib/store";
import { Contacto, ETAPAS_CRM, EtapaCRM, SEGMENTOS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, GripVertical } from "lucide-react";

export default function Pipeline() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => { setContactos(getContactos()); }, []);

  function onDragStart(id: string) { setDragging(id); }

  function onDrop(etapa: EtapaCRM) {
    if (!dragging) return;
    updateContacto(dragging, { etapa, fecha_ultimo_contacto: new Date().toISOString() });
    setContactos(getContactos());
    setDragging(null);
  }

  const etapasVisibles = ETAPAS_CRM.filter((e) => e.value !== "descartado");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Pipeline CRM</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Arrastra las tarjetas entre columnas para actualizar el estado
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {etapasVisibles.map((etapa) => {
          const cols = contactos.filter((c) => c.etapa === etapa.value);
          return (
            <div
              key={etapa.value}
              className="flex-shrink-0 w-64"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(etapa.value as EtapaCRM)}
            >
              {/* Cabecera columna */}
              <div className={`rounded-t-lg px-3 py-2 flex items-center justify-between ${etapa.color}`}>
                <span className="text-sm font-semibold">{etapa.label}</span>
                <span className="text-xs font-bold bg-white/60 rounded-full px-2 py-0.5">
                  {cols.length}
                </span>
              </div>

              {/* Zona de drop */}
              <div className="bg-slate-100 rounded-b-lg min-h-[400px] p-2 space-y-2">
                {cols.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => onDragStart(c.id)}
                    className={`bg-white rounded-lg shadow-sm p-3 cursor-grab active:cursor-grabbing border border-slate-200 hover:shadow-md transition-shadow ${
                      dragging === c.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-1">
                      <GripVertical size={14} className="text-slate-300 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                          {c.nombre_negocio}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {SEGMENTOS.find((s) => s.value === c.segmento)?.icono}{" "}
                          {SEGMENTOS.find((s) => s.value === c.segmento)?.label}
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          {c.telefono && (
                            <div className="flex items-center gap-1">
                              <Phone size={11} /> {c.telefono}
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1 truncate">
                              <Mail size={11} /> {c.email}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MapPin size={11} /> {c.alcaldia}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            c.score >= 80 ? "bg-green-100 text-green-700" :
                            c.score >= 50 ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            Score {c.score}
                          </span>
                          {c.fecha_ultimo_contacto && (
                            <span className="text-xs text-slate-400">
                              {new Date(c.fecha_ultimo_contacto).toLocaleDateString("es-MX", {
                                day: "numeric", month: "short"
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {cols.length === 0 && (
                  <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded-lg">
                    <p className="text-xs text-slate-400">Arrastra aquí</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
