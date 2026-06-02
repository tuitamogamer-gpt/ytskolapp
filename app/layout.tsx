import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🎬 YouTube Škola Studio",
  description:
    "Alati za rast YouTube kanala — ORA bodovanje naslova, TNT thumbnail, 4F validacija niše, kalkulator zarade, content plan sa izvozom u kalendar i baza znanja iz 12 lekcija.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bs">
      <body>{children}</body>
    </html>
  );
}
