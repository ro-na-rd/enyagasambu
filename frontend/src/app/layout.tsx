import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <LanguageProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
