import type { Metadata, Viewport } from "next";
import { siteUrl } from "./site-metadata";
import "./globals.css";
import "./portfolio.css";

export const metadata: Metadata = {
  title: "André Calazans | Portfólio",
  description: "Conteúdo, design e direção criativa. Projetos selecionados de André Calazans.",
  alternates: { canonical: siteUrl("/") },
  openGraph: {
    title: "André Calazans | Portfólio",
    description: "Conteúdo, design e direção criativa. Projetos selecionados de André Calazans.",
    url: siteUrl("/"),
    images: siteUrl("/sites/portfolio/cases/nice-audicoes-shared.webp"),
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#19163d",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
