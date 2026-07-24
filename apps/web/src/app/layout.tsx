import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chronoscope - Time Travel for the Web",
  description: "Watch the visual evolution of any website through beautifully stitched timelapses. See how the internet grew up.",
  openGraph: {
    title: "Chronoscope",
    description: "Watch the visual evolution of any website through beautifully stitched timelapses. See how the internet grew up.",
    url: 'https://chronoscope.app',
    siteName: 'Chronoscope',
    images: [
      {
        url: '/og-image.png', // We will generate this next
        width: 1200,
        height: 630,
        alt: 'Chronoscope - Visual history of the web',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronoscope',
    description: 'Watch the visual evolution of any website through beautifully stitched timelapses.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
