import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

import { TooltipProvider } from "@/components/ui/tooltip";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PusatVilla.id - Platform Sewa Villa Premium di Indonesia",
  description: "Temukan dan sewa villa terbaik untuk liburan Anda. Booking instant, harga transparan, dan lokasi strategis di seluruh Indonesia.",
  keywords: ["villa", "sewa villa", "villa murah", "villa puncak", "villa bandung", "villa bali", "booking villa", "villa liburan"],
  authors: [{ name: "PusatVilla.id" }],
  creator: "PusatVilla.id",
  publisher: "PusatVilla.id",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://pusatvilla.id',
    siteName: 'PusatVilla.id',
    title: 'PusatVilla.id - Platform Sewa Villa Premium',
    description: 'Temukan dan sewa villa terbaik untuk liburan Anda di Indonesia',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PusatVilla.id',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PusatVilla.id - Platform Sewa Villa Premium',
    description: 'Temukan dan sewa villa terbaik untuk liburan Anda di Indonesia',
    images: ['/og-image.png'],
  },
  other: {
    // Prevent browser from offering PWA install / app-like behavior
    "mobile-web-app-capable": "no",
    "apple-mobile-web-app-capable": "no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
