import { NextRequest, NextResponse } from "next/server";

// Coordenadas del centro de cada alcaldía de CDMX
const COORDENADAS: Record<string, [number, number]> = {
  "Miguel Hidalgo":           [19.4285, -99.1856],
  "Benito Juárez":            [19.3738, -99.1646],
  "Cuauhtémoc":               [19.4284, -99.1455],
  "Cuajimalpa":               [19.3569, -99.2970],
  "Álvaro Obregón":           [19.3593, -99.2020],
  "Coyoacán":                 [19.3467, -99.1617],
  "Azcapotzalco":             [19.4867, -99.1853],
  "Tlalpan":                  [19.2937, -99.1676],
  "Gustavo A. Madero":        [19.4984, -99.1083],
  "Iztapalapa":               [19.3574, -99.0563],
  "Iztacalco":                [19.3928, -99.1144],
  "Venustiano Carranza":      [19.4295, -99.1046],
  "Tláhuac":                  [19.2829, -99.0063],
  "Xochimilco":               [19.2571, -99.1045],
  "La Magdalena Contreras":   [19.3213, -99.2321],
  "Milpa Alta":               [19.1924, -99.0230],
};

// Palabras clave del DENUE por código de actividad
const KEYWORDS: Record<string, string> = {
  "722":  "restaurante",
  "7224": "bar cantina",
  "7223": "comida rapida",
  "931":  "corporativo",
  "5611": "empresa administracion",
  "5321": "coworking oficinas",
  "7139": "gimnasio",
  "8133": "fundacion asociacion",
  "7211": "hotel",
  "621":  "clinica consultorio",
};

// Datos demo cuando no hay token
function generarDemoData(alcaldia: string, actividad: string, pagina: number) {
  const giros: Record<string, string> = {
    "722": "Restaurante", "7224": "Bar", "7223": "Taquería", "931": "Corporativo",
    "5611": "Empresa", "5321": "Coworking", "7139": "Gimnasio",
    "8133": "Fundación", "7211": "Hotel", "621": "Clínica",
  };
  const nombre = giros[actividad] ?? "Negocio";
  const offset = (pagina - 1) * 10;
  return Array.from({ length: 10 }, (_, i) => {
    const n = offset + i + 1;
    return {
      Id: `demo_${n}`,
      Nombre: `${nombre} ${alcaldia} ${n}`,
      Clase_actividad: `Demo — ${nombre}`,
      Estrato: ["0 a 5 personas", "6 a 10 personas", "11 a 30 personas"][n % 3],
      Telefono: n % 3 !== 0 ? `55${String(n).padStart(8, "1")}` : "",
      Correo_e: n % 4 === 0 ? `contacto@${nombre.toLowerCase()}${n}.com.mx` : "",
      Sitio_internet: n % 4 === 0 ? `www.${nombre.toLowerCase()}${n}.com.mx` : "",
      Calle: `Av. Principal`, Num_Exterior: String(n * 10),
      Colonia: "Centro", Ubicacion: `${alcaldia}, Ciudad de México`,
      Latitud: "19.4284", Longitud: "-99.1455",
      _demo: true,
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const alcaldia  = searchParams.get("alcaldia")  ?? "Cuauhtémoc";
  const actividad = searchParams.get("actividad") ?? "722";
  const pagina    = parseInt(searchParams.get("pagina") ?? "1");
  const token     = process.env.DENUE_TOKEN;

  if (!token) {
    return NextResponse.json(generarDemoData(alcaldia, actividad, pagina), {
      headers: { "X-Demo-Mode": "true" },
    });
  }

  const coords = COORDENADAS[alcaldia] ?? [19.4284, -99.1455];
  const keyword = KEYWORDS[actividad] ?? "negocio";
  const radio = 5000; // 5 km de radio

  // URL correcta: /Buscar/{keyword}/{lat},{lon}/{metros}/{token}
  // devuelve todos los resultados (sin paginación nativa en este endpoint)
  const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/Buscar/${encodeURIComponent(keyword)}/${coords[0]},${coords[1]}/${radio}/${token}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      // @ts-expect-error — necesario para saltar SSL en algunos entornos Windows
      agent: undefined,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `DENUE respondió con error ${res.status}. Intenta con otra alcaldía o giro.` },
        { status: 502 }
      );
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json([], {
        headers: { "X-Total-Count": "0" },
      });
    }

    // Devuelve todos — la paginación se hace en el cliente
    return NextResponse.json(data, {
      headers: { "X-Total-Count": String(data.length) },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error de conexión con DENUE";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
