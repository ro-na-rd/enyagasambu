'use client';
import Link from 'next/link';
import { Home, BadgeCheck, Star } from '@/lib/icons';

interface AuthRegisterLayoutProps {
  badge?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

export default function AuthRegisterLayout({ badge = 'Marketplace', children, aside }: AuthRegisterLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-nmo-navy-dark">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 10% 15%, rgba(232,93,4,0.22), transparent 35%), radial-gradient(circle at 90% 85%, rgba(255,255,255,0.10), transparent 35%)' }} />

      {/* Home link top-left */}
      <Link
        href="/"
        className="absolute top-5 left-5 z-20 flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/25 px-4 py-2 text-white font-semibold text-sm transition hover:bg-white/20 shadow-lg"
      >
        <Home size={16} color="#FF8A3D" />
        Back to Home
      </Link>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2 items-center gap-10 px-4 py-16 lg:px-12 lg:py-0">
        {/* Left: marketplace content without decorative imagery */}
        <div className="hidden lg:flex flex-col gap-6 max-w-xl">
          {aside || (
            <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-8 text-white shadow-2xl">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black tracking-widest uppercase"><BadgeCheck size={13} /> {badge}</p>
              <h2 className="mt-5 text-3xl font-bold">Find trusted offers in one marketplace.</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">Sign in to manage your listings, connect with sellers, and keep track of the marketplace activity that matters to you.</p>
              <div className="mt-6 flex items-center gap-2 text-amber-300"><Star size={17} /> Quality listings, clear pricing, and direct sharing.</div>
            </div>
          )}
        </div>

        {/* Right: registration card */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-fadeInUp">
            {children}
          </div>
          <p className="text-center text-white/60 text-xs mt-6">
            © {new Date().getFullYear()} E-Nyagasambu Marketplace
          </p>
        </div>
      </div>
    </div>
  );
}
