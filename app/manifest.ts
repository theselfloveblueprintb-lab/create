import type { MetadataRoute } from "next";

// Real, valid web app manifest — Next.js 14 App Router native support.
// Icons below are placeholder brand marks generated for install-testing
// purposes (see public/icons/ generation script) — swap for real
// designed icons before a real launch, same file names/sizes.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Crea",
    short_name: "Crea",
    description: "Elke dag bewust voor jezelf kiezen. Aangepast aan jouw leven, niet andersom.",
    start_url: "/today",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7EFEA", // blush
    theme_color: "#2E2438", // ink
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
