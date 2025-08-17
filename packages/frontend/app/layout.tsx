import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Rituals - Daily Ritual Tracker",
  description: "Create, manage, and track daily rituals to improve your life",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body
        className={`${inter.className} antialiased bg-gradient-to-br from-[#0D0D0E] via-[#1C1C1E] to-[#2C2C2E] text-white h-full overflow-hidden`}
      >
        <Providers>
          <div className="w-full max-w-sm mx-auto h-full bg-[#1C1C1E] flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
