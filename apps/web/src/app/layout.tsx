import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { GrainOverlay } from "@/components/GrainOverlay";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Background3D } from "@/components/Background3D";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Muse | Virtual Listening Room",
  description: "Create private rooms to listen to music together in perfect synchronization",
  keywords: ["music", "listening room", "sync", "collaborative", "youtube"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased`}
      >
        {/* Dynamic Background */}
        <AmbientBackground />

        {/* 3D Visuals */}
        <Background3D />

        {/* Grain Overlay */}

        {/* Grain Overlay */}
        <GrainOverlay />

        {/* Main Content */}
        {children}
      </body>
    </html>
  );
}
