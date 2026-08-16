import type { Metadata } from "next";
import { Sora, Hanken_Grotesk, JetBrains_Mono, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/Toaster";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "500", "600", "700", "800"] });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", weight: ["400", "500", "600", "700"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", weight: ["400", "500", "600", "700"] });

// Landing page typeface pair — Geist for display/body, Geist Mono for technical labels.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Git AI - AI-Powered GitHub Engineering Manager",
  description: "Autonomous AI-powered GitHub assistant that analyzes repositories, predicts priorities, generates development plans, and automates commits.",
  keywords: "GitHub, AI, repository management, developer tools, automation",
  authors: [{ name: "Git AI" }],
  openGraph: {
    title: "Git AI",
    description: "Your personal AI engineering manager for GitHub",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${sora.variable} ${hanken.variable} ${jetbrainsMono.variable} ${geist.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
