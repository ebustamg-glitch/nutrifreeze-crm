"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Snowflake } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al iniciar sesión");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-cyan-600 p-3 rounded-2xl mb-4">
            <Snowflake size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NutriFreeze CRM</h1>
          <p className="text-slate-400 text-sm mt-1">Panel de ventas CDMX</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / vendedor"
              required
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
