"use client";
import { useState, useMemo } from "react";
import { buscarLeadsDenue } from "@/lib/denue";
import { addContactos } from "@/lib/store";
import { ALCALDIAS, GIROS_DENUE, Contacto, SEGMENTOS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Phone, Mail, Globe, MapPin, Users, CheckCircle } from "lucide-react";

const POR_PAGINA = 50;

export default function BuscarLeads() {
  const [alcaldia, setAlcaldia] = useState("");
  const [giro, setGiro] = useState("");
  const [todos, setTodos] = useState<Contacto[]>([]);       // todos los resultados cargados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importados, setImportados] = useState(0);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [pagina, setPagina] = useState(1);
  const [modoDemo, setModoDemo] = useState(false);

  // Paginación local — sin llamadas extra al API
  const totalPaginas = Math.max(1, Math.ceil(todos.length / POR_PAGINA));
  const resultados = useMemo(() => {
    const inicio = (pagina - 1) * POR_PAGINA;
    return todos.slice(inicio, inicio + POR_PAGINA);
  }, [todos, pagina]);

  async function buscar() {
    if (!alcaldia || !giro) return;
    setLoading(true);
    setError("");
    setImportados(0);
    setPagina(1);
    setTodos([]);
    // Siempre pide página 1 al API — que devuelve TODOS los resultados
    const res = await buscarLeadsDenue(alcaldia, giro, 1);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setTodos(res.contactos);
      setSeleccionados(new Set(res.contactos.map((c) => c.id)));
      setModoDemo(res.demo ?? false);
    }
  }

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function importarSeleccionados() {
    const aImportar = todos.filter((c) => seleccionados.has(c.id));
    const n = addContactos(aImportar);
    setImportados(n);
  }

  const segLabel = (seg: string) =>
    SEGMENTOS.find((s) => s.value === seg)?.label ?? seg;

  const seleccionadosEnPagina = resultados.filter((c) => seleccionados.has(c.id)).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Buscar Leads</h1>
        <p className="text-slate-500 text-sm mt-1">
          Datos oficiales del DENUE INEGI — negocios reales registrados en CDMX
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Alcaldía</label>
              <Select value={alcaldia} onValueChange={(v) => setAlcaldia(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar alcaldía..." />
                </SelectTrigger>
                <SelectContent>
                  {ALCALDIAS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[260px]">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Giro / Categoría</label>
              <Select value={giro} onValueChange={(v) => setGiro(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar giro..." />
                </SelectTrigger>
                <SelectContent>
                  {GIROS_DENUE.map((g) => (
                    <SelectItem key={g.codigo} value={g.codigo}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={buscar}
              disabled={!alcaldia || !giro || loading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Search size={16} className="mr-2" />
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda del score */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs">
        {[
          { color: "bg-green-100 text-green-700", label: "Score 80–100 = Teléfono + email + web" },
          { color: "bg-yellow-100 text-yellow-700", label: "Score 50–79 = Solo teléfono o email" },
          { color: "bg-red-100 text-red-700", label: "Score 40 = Sin datos de contacto" },
        ].map((s) => (
          <span key={s.label} className={`px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {modoDemo && todos.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <strong>Modo demo</strong> — datos de prueba. Token configurado en <code className="bg-amber-100 px-1 rounded">.env.local</code>
        </div>
      )}

      {todos.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{todos.length}</span> negocios encontrados
              · <span className="font-semibold">{seleccionados.size}</span> seleccionados en total
              · Página <span className="font-semibold">{pagina}</span> de <span className="font-semibold">{totalPaginas}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const idsPagina = resultados.map((c) => c.id);
                  const todosPaginaSeleccionados = idsPagina.every((id) => seleccionados.has(id));
                  setSeleccionados((prev) => {
                    const next = new Set(prev);
                    idsPagina.forEach((id) => todosPaginaSeleccionados ? next.delete(id) : next.add(id));
                    return next;
                  });
                }}
              >
                {seleccionadosEnPagina === resultados.length ? "Deseleccionar página" : "Seleccionar página"}
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={importarSeleccionados}
                disabled={seleccionados.size === 0}
              >
                <Download size={15} className="mr-1" />
                Importar {seleccionados.size} contactos
              </Button>
            </div>
          </div>

          {importados > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {importados} contactos nuevos agregados a tu base de datos.
            </div>
          )}

          <div className="grid gap-3">
            {resultados.map((c) => (
              <Card
                key={c.id}
                className={`cursor-pointer transition-all ${
                  seleccionados.has(c.id) ? "ring-2 ring-cyan-400" : "opacity-60"
                }`}
                onClick={() => toggleSeleccion(c.id)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800 truncate">{c.nombre_negocio}</h3>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {segLabel(c.segmento)}
                        </Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.score >= 80 ? "bg-green-100 text-green-700" :
                          c.score >= 50 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          Score {c.score}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{c.giro_denue}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
                        {c.telefono && <span className="flex items-center gap-1"><Phone size={12} /> {c.telefono}</span>}
                        {c.email && <span className="flex items-center gap-1"><Mail size={12} /> {c.email}</span>}
                        {c.sitio_web && <span className="flex items-center gap-1"><Globe size={12} /> {c.sitio_web}</span>}
                        <span className="flex items-center gap-1"><MapPin size={12} /> {c.colonia}, {c.alcaldia}</span>
                        {c.empleados_rango && <span className="flex items-center gap-1"><Users size={12} /> {c.empleados_rango}</span>}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-cyan-600"
                      checked={seleccionados.has(c.id)}
                      onChange={() => toggleSeleccion(c.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <Button
                variant="outline"
                disabled={pagina === 1}
                onClick={() => { setPagina(p => p - 1); window.scrollTo(0, 0); }}
              >
                Anterior
              </Button>
              <span className="text-sm text-slate-600 font-medium">
                Página {pagina} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                disabled={pagina === totalPaginas}
                onClick={() => { setPagina(p => p + 1); window.scrollTo(0, 0); }}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
