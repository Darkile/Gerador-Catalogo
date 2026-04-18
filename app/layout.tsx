import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "@/design/gregory-design-tokens.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Gerador de Catálogo Gregory",
  description: "Plataforma editorial para geração de catálogo PDF A4 com IA e Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
