import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Unbounded } from "next/font/google";
import { PageTransition } from "@/components/sport/PageTransition";
import "./globals.css";

// Same trio as digitamoney.com.br: Unbounded for headings, Manrope for text, IBM Plex Mono for labels.
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: "Sistema de Disputa",
  description: "Gestão de torneios esportivos: chaveamento, agenda, súmulas e estatísticas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${unbounded.variable} ${manrope.variable} ${plexMono.variable} antialiased`}>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        {children}
        <PageTransition />
      </body>
    </html>
  );
}
