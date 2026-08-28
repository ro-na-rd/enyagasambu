'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Home, BadgeCheck, MapPin, Star } from '@/lib/icons';

const HOUSE_IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
];

const FEATURED_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=80';

interface AuthRegisterLayoutProps {
  badge?: string;
  children: React.ReactNode;
}

export default function AuthRegisterLayout({ badge = 'Featured Apartment', children }: AuthRegisterLayoutProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HOUSE_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-nmo-navy-dark">
      {/* Animated background: crossfading best houses */}
      <div className="absolute inset-0">
        {HOUSE_IMAGES.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${i === idx ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover kenburns" />
          </div>
        ))}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(10,20,48,0.93) 0%, rgba(10,20,48,0.78) 45%, rgba(232,93,4,0.45) 100%)',
          }}
        />
        <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(232,93,4,0.18), transparent 50%)' }} />
      </div>

      {/* Home link top-left */}
      <Link
        href="/"
        className="absolute top-5 left-5 z-20 flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/25 px-4 py-2 text-white font-semibold text-sm transition hover:bg-white/20 shadow-lg"
      >
        <Home size={16} color="#FF8A3D" />
        Back to Home
      </Link>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2 items-center gap-10 px-4 py-16 lg:px-12 lg:py-0">
        {/* Left: best apartment image */}
        <div className="hidden lg:flex flex-col gap-6 max-w-xl">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/15">
            <img src={FEATURED_IMAGE} alt="Best apartment" className="w-full h-[440px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-nmo-navy">
              <Star size={13} /> 4.9
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase mb-3"
                style={{ background: 'rgba(232,93,4,0.9)', color: '#fff' }}>
                <BadgeCheck size={13} /> {badge}
              </p>
              <h2 className="font-heading text-2xl font-bold leading-tight drop-shadow">Modern 4-Bed Villa, Kigali</h2>
              <p className="flex items-center gap-1.5 text-white/85 text-sm mt-1"><MapPin size={14} /> Kicukiro, Kigali City</p>
              <p className="text-2xl font-black mt-3" style={{ color: '#FF8A3D' }}>RWF 450,000,000</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { v: '2,400+', l: 'Verified Listings' },
              { v: '850+', l: 'Happy Owners' },
              { v: '120+', l: 'Expert Brokers' },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 text-center">
                <p className="text-lg font-black text-white">{s.v}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">{s.l}</p>
              </div>
            ))}
          </div>
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
