import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import WhatsAppButton from '@/components/WhatsAppButton';

export const metadata: Metadata = {
  title: 'NMO – Nyagasambu Market Online',
  description: 'Buy, sell, and rent goods & services in Kigali, Rwanda',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Poppins:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
        <AuthProvider>
          {children}
          <WhatsAppButton />
        </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
