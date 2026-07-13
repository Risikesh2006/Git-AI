import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={`${inter.variable} font-sans antialiased bg-black text-white min-h-screen`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
