import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { siteUrl } from "../site-metadata";

export const metadata: Metadata = {
  title: "Xandrielly Xandon",
  description: "Drag queen, performer, DJ, apresentadora e criadora. Links e lançamentos de Xandrielly Xandon.",
  alternates: { canonical: siteUrl("/bio/") },
  openGraph: {
    title: "Xandrielly Xandon",
    description: "Drag queen, performer, DJ, apresentadora e criadora.",
    url: siteUrl("/bio/"),
    images: siteUrl("/sites/bio/cover-funk-x-tech-clear.png"),
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#080b07", colorScheme: "dark", viewportFit: "cover" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
