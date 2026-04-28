import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kerviqo Event Rental SaaS",
  description: "Premium SaaS for event and wedding rental companies in Morocco."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
