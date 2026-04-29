import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NutriFreeze CRM",
  description: "Panel de leads y ventas para NutriFreeze CDMX",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("nf_session")?.value;
  const user = token ? await verifyToken(token) : null;

  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className={`min-h-full bg-slate-50 ${user ? "flex" : ""}`}>
        {user && <Sidebar user={user} />}
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
