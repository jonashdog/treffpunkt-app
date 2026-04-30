import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://treffpunkt.me"),
  title: "Treffpunkt – Find dates. Without stress.",
  description:
    "Create a poll, share the link and find the best date together – no registration needed.",
  keywords: ["scheduling", "Doodle alternative", "date poll", "meet friends", "Terminfindung"],
  openGraph: {
    title: "Treffpunkt – Find dates. Without stress.",
    description: "Create a poll, share the link and find the best date together.",
    type: "website",
    url: "https://treffpunkt.me",
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
