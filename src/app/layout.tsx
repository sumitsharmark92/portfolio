import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#08070d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "JamSync — Real-Time Collaborative Music Sharing",
  description:
    "JamSync is a high-performance collaborative music-sharing application featuring real-time playback synchronization, glassmorphism UI, integrated YouTube music search without API keys, dynamic room queues, and live chat.",
  keywords: [
    "JamSync",
    "Collaborative Music",
    "Real-Time Sync",
    "Music Room",
    "Listen Together",
    "Synchronized Audio",
    "YouTube Music",
    "Glassmorphism",
  ],
  openGraph: {
    title: "JamSync — Real-Time Collaborative Music Sharing",
    description:
      "Listen to music together in perfect real-time sync with friends. Zero YouTube API keys required.",
    url: "https://jamsync.app",
    siteName: "JamSync",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JamSync — Real-Time Collaborative Music Sharing",
    description: "Listen together with synchronized playback and live chat.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark scroll-smooth ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#08070d] text-white antialiased font-sans selection:bg-purple-500/30 selection:text-purple-300">
        {children}
      </body>
    </html>
  );
}
