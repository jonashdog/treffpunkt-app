import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";

export const metadata: Metadata = {
  title: "Treffpunkt – Termine finden. Ohne Stress.",
  description:
    "Erstelle eine Umfrage, teile den Link und findet gemeinsam den besten Termin – ganz ohne Registrierung.",
  keywords: ["Terminfindung", "Doodle Alternative", "Terminumfrage", "Freunde treffen"],
  openGraph: {
    title: "Treffpunkt – Termine finden. Ohne Stress.",
    description: "Erstelle eine Umfrage, teile den Link und findet gemeinsam den besten Termin.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
