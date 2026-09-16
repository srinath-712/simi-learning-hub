import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simi Learning Hub — Learn Smarter",
  description:
    "Access curated notes, video lectures, YouTube tutorials, and more — all organised by subject, available on any device.",
  keywords: ["learning", "education", "online courses", "notes", "video lectures", "tutor"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f0f13] text-gray-100 font-[family-name:var(--font-inter)]">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
