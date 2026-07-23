'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AmbassadorLoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1e42 60%, #E85D04 100%)' }}><p className="text-white/70 text-sm">Redirecting to unified login...</p></div>;
}
