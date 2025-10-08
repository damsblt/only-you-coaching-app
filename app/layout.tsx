import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/video-player.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Marie-Line Pilates - Coaching en ligne",
  description: "Découvrez le Pilates avec Marie-Line. Vidéos de coaching, méditations et séances en ligne pour tous les niveaux.",
  keywords: "pilates, coaching, méditation, fitness, bien-être, Marie-Line",
  authors: [{ name: "Marie-Line" }],
  openGraph: {
    title: "Marie-Line Pilates - Coaching en ligne",
    description: "Découvrez le Pilates avec Marie-Line. Vidéos de coaching, méditations et séances en ligne pour tous les niveaux.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <Providers>
          <div className="relative flex flex-col min-h-screen overflow-x-hidden">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
