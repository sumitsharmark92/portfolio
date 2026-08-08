import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resplendence 3D | Luxury Bangles & Kangan Collection",
  description:
    "Discover exquisite handcrafted Chudi, Kangan, and bangle sets. Build your perfect stack with our immersive 3D customizer. Traditional Indian heritage meets modern luxury.",
  keywords: [
    "bangles",
    "chudi",
    "kangan",
    "Indian jewelry",
    "3D jewelry",
    "gold bangles",
    "glass bangles",
    "kundan bangles",
    "luxury bangles",
    "bangle customizer",
  ],
  openGraph: {
    title: "Resplendence 3D | Luxury Bangles & Kangan Collection",
    description:
      "Build your perfect bangle stack with our immersive 3D customizer.",
    type: "website",
    siteName: "Resplendence 3D",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-obsidian text-ivory antialiased">
        {children}
      </body>
    </html>
  );
}
