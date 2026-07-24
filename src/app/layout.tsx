import type { Metadata, Viewport } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
});

const siteUrl = "https://srimurugancinema.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sri Murugan Cinema | Experience Cinema Like Never Before",
    template: "%s | Sri Murugan Cinema",
  },
  description:
    "Premium movie theatre in Coimbatore with 4K Barco projection, 64-channel Dolby Atmos, push-back seating and daily shows. Book your tickets now at Sri Murugan Cinema, Thudiyalur.",
  keywords: [
    "Sri Murugan Cinema",
    "Murugan Cinemas",
    "Coimbatore cinema",
    "Thudiyalur theatre",
    "4K projection Coimbatore",
    "Dolby Atmos Coimbatore",
    "BookMyShow Coimbatore",
    "movie theatre Coimbatore",
    "push back seating",
    "best cinema in Coimbatore",
  ],
  authors: [{ name: "Sri Murugan Cinema" }],
  creator: "Sri Murugan Cinema",
  publisher: "Sri Murugan Cinema",
  applicationName: "Sri Murugan Cinema",
  category: "Entertainment",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Sri Murugan Cinema",
    title: "Sri Murugan Cinema | Experience Cinema Like Never Before",
    description:
      "Premium movie theatre in Coimbatore with 4K Barco projection, 64-channel Dolby Atmos, push-back seating and daily shows.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Sri Murugan Cinema Logo",
      },
      {
        url: "/hero-cinema.png",
        width: 1200,
        height: 630,
        alt: "Sri Murugan Cinema Hall",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sri Murugan Cinema | Experience Cinema Like Never Before",
    description:
      "Premium movie theatre in Coimbatore with 4K Barco projection, 64-channel Dolby Atmos, push-back seating and daily shows.",
    images: ["/hero-cinema.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dancingScript.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MovieTheater",
              name: "Sri Murugan Cinema",
              description:
                "Premium movie theatre in Coimbatore with 4K Barco projection, 64-channel Dolby Atmos, push-back seating and daily shows.",
              url: siteUrl,
              image: `${siteUrl}/logo.png`,
              logo: `${siteUrl}/logo.png`,
              telephone: "+91-422-000-0000",
              priceRange: "₹₹",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Mettupalayam Road, Thudiyalur",
                addressLocality: "Coimbatore",
                addressRegion: "Tamil Nadu",
                postalCode: "641043",
                addressCountry: "IN",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "11.0326",
                longitude: "76.9553",
              },
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday", "Tuesday", "Wednesday", "Thursday",
                  "Friday", "Saturday", "Sunday",
                ],
                opens: "10:00",
                closes: "22:00",
              },
              sameAs: [
                "https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/",
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
