import type { Metadata } from "next";
import { Inter, Raleway, Scheherazade_New } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

const scheherazade = Scheherazade_New({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-scheherazade",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jamaat Khadki Pune — Dawoodi Bohra Community Portal",
    template: "%s | Jamaat Khadki Pune",
  },
  description:
    "Official community portal for Dawoodi Bohra Jamaat, Khadki, Pune. Ashara 1448H countdown, hall bookings, madrasa portal, FMB menu, miqaat calendar and more.",
  keywords: ["Dawoodi Bohra", "Khadki", "Pune", "Jamaat", "Ashara", "Bohra", "Muharram"],
  openGraph: {
    siteName: "Jamaat Khadki Pune",
    locale: "en_IN",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${raleway.variable} ${scheherazade.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col bg-cream">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
