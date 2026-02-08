import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/video-player.css";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import HeaderAssetsPreloader from "@/components/HeaderAssetsPreloader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Only You Coaching",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white transition-colors">
        <ErrorBoundary>
          <Providers>
            <div className="relative flex flex-col min-h-screen overflow-x-hidden overflow-y-auto">
              <HeaderAssetsPreloader />
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
