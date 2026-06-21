// TODO: root layout + import globals.css
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lonjak - Ticket Drop & Flash Sale",
  description: "Aplikasi web flash sale / ticket drop terukur dan berkinerja tinggi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
