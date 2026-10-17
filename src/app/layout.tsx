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
  title: "Sumit Sharma — Red Team Operator & Cybersecurity Architect | sumit-labs.me",
  description:
    "Personal cybersecurity portfolio & technical dossier of Sumit Sharma. Red Team operator, penetration testing researcher, and full-stack architect with interactive CLI, port scanner, and JamSync collaborative rooms.",
  keywords: [
    "Sumit Sharma",
    "Cybersecurity Portfolio",
    "Red Team",
    "Penetration Testing",
    "SOC Operations",
    "JamSync",
    "Network Security",
    "Port Scanner",
  ],
  openGraph: {
    title: "Sumit Sharma — Red Team Operator & Cybersecurity Architect",
    description:
      "Cybersecurity portfolio of Sumit Sharma. Features interactive terminal CLI, live port scanner, security schematics, and JamSync rooms.",
    url: "https://sumit-labs.me",
    siteName: "Sumit Sharma Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sumit Sharma — Red Team Operator & Cybersecurity Architect",
    description:
      "Interactive cybersecurity portfolio with live tools, terminal CLI, and JamSync collaborative music.",
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
