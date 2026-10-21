import type { Metadata } from "next";
import { Poppins, Bebas_Neue, Playfair_Display, Syncopate } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const theGlobe = localFont({
  src: "../../Fonts/TheGlobePersonalUseBold-2ORlw.ttf",
  variable: "--font-the-globe",
  display: "block",
});

const bighornItalic = localFont({
  src: "../../Fonts/Bighorn Italic.otf",
  variable: "--font-bighorn",
  display: "block",
});

const superMellow = localFont({
  src: "../../Fonts/SuperMellowRegular-e90Vg.ttf",
  variable: "--font-super-mellow",
  display: "block",
});

const guberaMono = localFont({
  src: "../../Fonts/GuberaMonoDemoRegular-MA6Vv.ttf",
  variable: "--font-gubera-mono",
  display: "block",
});

const manlineSlabs = localFont({
  src: "../../Fonts/ManlineSlabs-pgPVy.otf",
  variable: "--font-manline",
  display: "block",
});

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ncqc27.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Nalanda College Quiz Club | NCQC',
    template: '%s | Nalanda College Quiz Club',
  },
  description: 'Official website of the Nalanda College Quiz Club. Join the Intellectus 2026 inter-school quiz competition.',
  keywords: [
    'Nalanda College Quiz Club',
    'NCQC',
    'Nalanda College Colombo 10',
    'Intellectus 2026',
    'Intellectus inter-school quiz competition',
    'Sri Lanka school quiz clubs',
    'general knowledge quiz Sri Lanka',
    'Nalanda College societies',
    'Sinhala and English medium quiz',
    'Advanced Level students quiz',
    'Colombo schools quiz competitions',
    'education and science quiz Sri Lanka',
    'Nalanda College',
    'Quiz Club',
    'Intellectus',
  ],
  authors: [{ name: 'Nalanda College Quiz Club', url: siteUrl }],
  creator: 'Nalanda College Quiz Club',
  publisher: 'Nalanda College Colombo 10',
  applicationName: 'Nalanda College Quiz Club Portal',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nalanda College Quiz Club | NCQC',
    description: 'Official website of the Nalanda College Quiz Club. Join the Intellectus 2026 inter-school quiz competition.',
    url: siteUrl,
    siteName: 'Nalanda College Quiz Club',
    images: [
      {
        url: '/homelogo.png',
        width: 1200,
        height: 630,
        alt: 'Nalanda College Quiz Club Logo',
      },
    ],
    locale: 'en_LK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nalanda College Quiz Club | NCQC',
    description: 'Official website of the Nalanda College Quiz Club. Join the Intellectus 2026 inter-school quiz competition.',
    images: ['/homelogo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/tab.png', href: '/tab.png' },
    ],
    shortcut: ['/tab.png'],
    apple: [
      { url: '/tab.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${siteUrl}/#organization`,
      name: 'Nalanda College Quiz Club',
      alternateName: ['NCQC', 'Nalanda Quiz Club', 'NCQC Colombo'],
      url: siteUrl,
      logo: `${siteUrl}/homelogo.png`,
      description: 'Official website of the Nalanda College Quiz Club. Join the Intellectus 2026 inter-school quiz competition.',
      foundingDate: '1982',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Nalanda College, Ananda Rajakaruna Mawatha',
        addressLocality: 'Colombo 10',
        addressRegion: 'Western Province',
        addressCountry: 'LK',
      },
      sameAs: [
        'https://facebook.com',
        'https://instagram.com',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Nalanda College Quiz Club',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
    },
  ],
};

import SecurityShield from "@/components/SecurityShield";
import { Suspense } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="icon" type="image/png" href="/tab.png" />
        <link rel="shortcut icon" href="/tab.png" />
        <link rel="apple-touch-icon" href="/tab.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preload" href="/fonts/TheGlobePersonalUseBold-2ORlw.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/SuperMellowRegular-e90Vg.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/GuberaMonoDemoRegular-MA6Vv.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/ManlineSlabs-pgPVy.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Bighorn%20Italic.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alfa+Slab+One&family=Anton&family=Archivo+Black&family=Audiowide&family=Barlow:wght@400;700;900&family=Bebas+Neue&family=Bungee&family=Caveat:wght@400;700&family=Cinzel:wght@400;700;900&family=Comfortaa:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;700;900&family=Dancing+Script:wght@400;700&family=Exo+2:wght@400;700;900&family=Fira+Sans:wght@400;700&family=Great+Vibes&family=Inter:wght@400;700;800;900&family=Josefin+Sans:wght@400;700&family=Kaushan+Script&family=Lato:wght@400;700;900&family=Lobster&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=Mukta:wght@400;700&family=Mulish:wght@400;700;900&family=Nunito:wght@400;700;900&family=Nunito+Sans:wght@400;700;900&family=Open+Sans:ital,wght@0,400;0,700;1,400&family=Orbitron:wght@400;700;900&family=Oswald:wght@400;700&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@400;700;800&family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Press+Start+2P&family=Quicksand:wght@400;700&family=Raleway:wght@400;700;900&family=Righteous&family=Roboto:ital,wght@0,400;0,700;0,900;1,400&family=Rubik:wght@400;700;900&family=Russo+One&family=Satisfy&family=Shadows+Into+Light&family=Space+Grotesk:wght@400;700&family=Syne:wght@400;700;800&family=Ubuntu:ital,wght@0,400;0,700;1,400&family=Work+Sans:wght@400;700;900&display=swap" />
      </head>
      <body suppressHydrationWarning className={`${poppins.variable} ${bebasNeue.variable} ${playfairDisplay.variable} ${syncopate.variable} ${theGlobe.variable} ${bighornItalic.variable} ${superMellow.variable} ${guberaMono.variable} ${manlineSlabs.variable} font-sans bg-white text-red-600 antialiased overflow-x-hidden`}>
        <SecurityShield />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
