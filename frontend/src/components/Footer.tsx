'use client';
import { useLanguage } from '@/context/LanguageContext';
import { MapPin, Phone, Mail } from '@/lib/icons';

export default function Footer() {
  const { T } = useLanguage();
  return (
    <footer style={{ background: '#0f1e42' }} className="text-white py-10 mt-8">
      <div className="max-w-6xl mx-auto px-4 grid gap-8 sm:grid-cols-3">
        <div>
          <p className="font-extrabold text-lg mb-1">
            <span style={{ color: '#E85D04' }}>E-</span>Nyagasambu
          </p>
          <p style={{ color: '#E85D04' }} className="text-[10px] font-bold tracking-widest uppercase mb-3">
            {T.digitalMarketPlace}
          </p>
          <p className="text-sm text-white/70">{T.footerDesc}</p>
        </div>
        <div>
          <p className="font-bold mb-3 text-sm">{T.contact}</p>
          <p className="text-sm text-white/70 flex items-center gap-2"><MapPin size={14} /> Kigali, Rwanda</p>
          <p className="text-sm text-white/70 flex items-center gap-2"><Phone size={14} /> 0786680301</p>
          <p className="text-sm text-white/70 flex items-center gap-2"><Mail size={14} /> E-Nyagasambu@gmail.com</p>
        </div>
        <div>
          <p className="font-bold mb-3 text-sm">{T.quickLinks}</p>
          <div className="flex flex-col gap-1.5 text-sm text-white/70">
            <a href="/listings" className="hover:text-[#E85D04] transition">{T.allListings}</a>
            <a href="/login" className="hover:text-[#E85D04] transition">{T.signIn}</a>
            <a href="/register" className="hover:text-[#E85D04] transition">{T.register}</a>
            <a href="/coins" className="hover:text-[#E85D04] transition">{T.buyCoins}</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 mt-8 pt-5 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} Nyagasambu Market Online (NMO) — {T.allRights}
      </div>
    </footer>
  );
}
