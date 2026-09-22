'use client';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRegistrationStatus } from '@/hooks/useRegistrationStatus';

export default function RegistrationGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const open = useRegistrationStatus();

  useEffect(() => {
    if (open === false) router.replace('/login?registration=closed');
  }, [open, router]);

  if (open === false) return null;
  if (open === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fc' }}>
      <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
    </div>
  );

  return <>{children}</>;
}