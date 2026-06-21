import type { Metadata } from "next";
import { Anton, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LONJAK / Ticket Drop Tahan Lonjakan",
  description:
    "Flash sale tiket konser yang tahan lonjakan trafik dan anti-overselling. Dibangun di atas Next.js dan Supabase.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${anton.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body className="bg-ink text-paper antialiased">{children}</body>
    </html>
  );
}
