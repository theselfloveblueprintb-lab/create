import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { UpdateNotifier } from "@/components/pwa/UpdateNotifier";

export const metadata: Metadata = {
  title: "Crea — Jouw adaptieve coach",
  description: "Elke dag bewust voor jezelf kiezen. Aangepast aan jouw leven, niet andersom.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Crea",
  },
  icons: {
    icon: "/icons/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E2438",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        {children}
        <ServiceWorkerRegistration />
        <UpdateNotifier />
      </body>
    </html>
  );
}
