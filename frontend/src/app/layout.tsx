import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import WhatsAppButton from '@/components/WhatsAppButton';

export const metadata: Metadata = {
  metadataBase: new URL('https://enyagasambu.rw'),
  title: {
    default: 'E-Nyagasambu | Digital Marketplace Rwanda',
    template: '%s | E-Nyagasambu',
  },
  description: 'Buy, sell, rent, and auction goods & services in Rwanda. The trusted digital marketplace connecting buyers, sellers, brokers, ambassadors, and suppliers.',
  keywords: ['marketplace', 'Rwanda', 'buy', 'sell', 'rent', 'auction', 'Kigali', 'Nyagasambu'],
  authors: [{ name: 'E-Nyagasambu Ltd' }],
  creator: 'E-Nyagasambu',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://enyagasambu.rw',
    siteName: 'E-Nyagasambu',
    title: 'E-Nyagasambu | Digital Marketplace Rwanda',
    description: 'Buy, sell, rent, and auction goods & services in Rwanda.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'E-Nyagasambu Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-Nyagasambu | Digital Marketplace Rwanda',
    description: 'Buy, sell, rent, and auction goods & services in Rwanda.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cal+Sans&family=Inter:wght@100..900&family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&family=Playfair+Display:wght@700;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
        <CurrencyProvider>
        <AuthProvider>
          {children}
          <WhatsAppButton />
        </AuthProvider>
        </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
