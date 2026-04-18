import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@/design/gregory-design-tokens.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
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
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
