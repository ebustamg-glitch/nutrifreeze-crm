"use client";
import { useEffect, useState } from "react";
import { getContactos, getCitas, getActividades } from "@/lib/store";
import { Contacto, Cita, Actividad, ETAPAS_CRM, SEGMENTOS, ALCALDIAS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Send, TrendingUp, MessageCircle, Mail } from "lucide-react";

export default function Analytics() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);

  useEffect(() => {
    setContactos(getContactos());
    setCitas(getCitas());
    setActividades(getActividades());
  }, []);

  const total = contactos.length;
  const cerrados = contactos.filter((c) => c.etapa === "cerrado").length;
  const interesados = contactos.filter((c) => c.etapa === "interesado" || c.etapa === "cita_agendada" || c.etapa === "visitado").length;
  const tasa = total > 0 ? Math.round((cerrados / total) * 100) : 0;
  const emailsEnviados = actividades.filter((a) => a.tipo === "email").length;
  const whatsEnviados = actividades.filter((a) => a.tipo === "whatsapp").length;
  const citasTotal = citas.length;
  const citasCompletadas = citas.filter((c) => c.completada).length;

  // Por etapa
  const porEtapa = ETAPAS_CRM.map((e) => ({
    ...e,
    count: contactos.filter((c) => c.etapa === e.value).length,
  })).filter((e) => e.count > 0);

  // Por segmento
  const porSegmento = SEGMENTOS.map((s) => ({
    ...s,
    count: contactos.filter((c) => c.segmento === s.value).length,
  })).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);

  // Por alcaldía (top 8)
  const porAlcaldia = ALCALDIAS.map((a) => ({
    nombre: a,
    count: contactos.filter((c) => c.alcaldia === a || c.alcaldia.includes(a.split(" ")[0])).length,
  })).filter((a) => a.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);

  const maxAlcaldia = porAlcaldia[0]?.count ?? 1;
  const maxSegmento = porSegmento[0]?.count ?? 1;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Resumen de tu pipeline y actividad de ventas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total contactos", value: total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Tasa de cierre", value: `${tasa}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Emails enviados", value: emailsEnviados, icon: Mail, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "WhatsApp enviados", value: whatsEnviados, icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
                <div className={`${kpi.bg} ${kpi.color} p-3 rounded-xl`}>
                  <kpi.icon size={22} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pipeline por etapa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {porEtapa.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {porEtapa.map((e) => (
                  <div key={e.value} className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-32 text-center shrink-0 ${e.color}`}>
                      {e.label}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-cyan-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${total > 0 ? (e.count / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-6 text-right">{e.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por segmento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por segmento</CardTitle>
          </CardHeader>
          <CardContent>
            {porSegmento.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {porSegmento.map((s) => (
                  <div key={s.value} className="flex items-center gap-3">
                    <span className="text-xs w-36 truncate shrink-0 text-slate-600">
                      {s.icono} {s.label}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-violet-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${(s.count / maxSegmento) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-6 text-right">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por alcaldía */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por alcaldía</CardTitle>
          </CardHeader>
          <CardContent>
            {porAlcaldia.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {porAlcaldia.map((a) => (
                  <div key={a.nombre} className="flex items-center gap-3">
                    <span className="text-xs w-36 truncate shrink-0 text-slate-600">{a.nombre}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-orange-400 h-2.5 rounded-full transition-all"
                        style={{ width: `${(a.count / maxAlcaldia) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-6 text-right">{a.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Citas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de citas y actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Calendar size={16} className="text-purple-500" />
                  Citas agendadas
                </div>
                <span className="font-bold text-slate-800">{citasTotal}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Calendar size={16} className="text-green-500" />
                  Citas completadas
                </div>
                <span className="font-bold text-slate-800">{citasCompletadas}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <TrendingUp size={16} className="text-cyan-500" />
                  Leads interesados
                </div>
                <span className="font-bold text-slate-800">{interesados}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                  <TrendingUp size={16} />
                  Ventas cerradas
                </div>
                <span className="font-bold text-green-700 text-lg">{cerrados}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
