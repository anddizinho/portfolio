import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Área de edição | Portfólio",
  robots: { index: false, follow: false },
  alternates: null,
  openGraph: null,
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
