import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Fusioners — Multimodal Evidence Intelligence",
  description: "Production-minded evidence extraction, claims fusion, and conflict resolution platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-white">
      <body className="min-h-screen bg-white text-neutral-900 font-serif antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
