import type { Metadata } from "next";
import { Poppins, Bebas_Neue, Playfair_Display, Syncopate } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-primary",
});

const bebasNeue = Bebas_Neue({
  weight: ['400'],
  subsets: ["latin"],
  variable: "--font-impact",
});

const playfairDisplay = Playfair_Display({
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  subsets: ["latin"],
  variable: "--font-secondary",
});

const syncopate = Syncopate({
  weight: ['700'],
  subsets: ["latin"],
  variable: "--font-brutalist",
});

export const metadata: Metadata = {
  title: "Nalanda College Quiz Club",
  description: "The world's most elegant quiz society. Pure intellect.",
};

import { Suspense } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alfa+Slab+One&family=Anton&family=Archivo+Black&family=Audiowide&family=Barlow:wght@400;700;900&family=Bebas+Neue&family=Bungee&family=Caveat:wght@400;700&family=Cinzel:wght@400;700;900&family=Comfortaa:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;700;900&family=Dancing+Script:wght@400;700&family=Exo+2:wght@400;700;900&family=Fira+Sans:wght@400;700&family=Great+Vibes&family=Inter:wght@400;700;800;900&family=Josefin+Sans:wght@400;700&family=Kaushan+Script&family=Lato:wght@400;700;900&family=Lobster&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=Mukta:wght@400;700&family=Mulish:wght@400;700;900&family=Nunito:wght@400;700;900&family=Nunito+Sans:wght@400;700;900&family=Open+Sans:ital,wght@0,400;0,700;1,400&family=Orbitron:wght@400;700;900&family=Oswald:wght@400;700&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@400;700;800&family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Press+Start+2P&family=Quicksand:wght@400;700&family=Raleway:wght@400;700;900&family=Righteous&family=Roboto:ital,wght@0,400;0,700;0,900;1,400&family=Rubik:wght@400;700;900&family=Russo+One&family=Satisfy&family=Shadows+Into+Light&family=Space+Grotesk:wght@400;700&family=Syne:wght@400;700;800&family=Ubuntu:ital,wght@0,400;0,700;1,400&family=Work+Sans:wght@400;700;900&display=swap" />
      </head>
      <body className={`${poppins.variable} ${bebasNeue.variable} ${playfairDisplay.variable} ${syncopate.variable} font-sans bg-white text-red-600 antialiased overflow-x-hidden`}>
        <Suspense fallback={<main className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</main>}>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Suspense>
      </body>
    </html>
  );
}
