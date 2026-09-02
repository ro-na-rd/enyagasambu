'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteContent } from '@/lib/useSiteContent';
import api from '@/lib/api';
import { MapPin, Phone, Mail, CheckCircle } from '@/lib/icons';

const socials = [
  {
    name: 'Facebook',
    href: '#',
    path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  },
  {
    name: 'Twitter',
    href: '#',
    path: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z',
  },
  {
    name: 'Instagram',
    href: '#',
    path: 'M16 3H8a5 5 0 0 0-5 5v8a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5V8a5 5 0 0 0-5-5zm-4 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.5-8.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  },
  {
    name: 'LinkedIn',
    href: '#',
    path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v1.5A6 6 0 0 1 16 8zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  },
];

export default function Footer() {
  const { T } = useLanguage();
  const { get } = useSiteContent();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/newsletter', { email, source: 'footer' });
      setSubscribed(true);
      setEmail('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative mt-12 bg-[#0d1b3e] text-white">
      <div className="h-px bg-gradient-to-r from-transparent via-[#E85D04]/60 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block">
              <div className="flex items-center gap-3">
                <img src="/assets/LOGO1.png" alt="E-Nyagasambu" className="w-12 h-12 object-contain shrink-0" />
                <div>
                  <p className="text-2xl font-extrabold tracking-tight">
                    <span style={{ color: '#E85D04' }}>E-</span>Nyagasambu
                  </p>
                  <p style={{ color: '#E85D04' }} className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em]">
                    {T.digitalMarketPlace}
                  </p>
                </div>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">{get('footer.description', T.footerDesc)}</p>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{T.followUs}</p>
              <div className="mt-3 flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    aria-label={s.name}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-[#E85D04] hover:text-white hover:ring-[#E85D04]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Marketplace */}
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/40">{T.marketplace}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: '/listings', label: T.allListings },
                { href: '/listings?category=products', label: T.products },
                { href: '/listings?category=properties', label: T.properties },
                { href: '/listings?category=vehicles', label: T.vehicles },
                { href: '/listings?category=services', label: T.services },
                { href: '/coins', label: T.buyCoins },
              ].map((l) => (
                <li key={l.href + l.label}>
                  <a href={l.href} className="text-white/70 transition hover:text-[#E85D04]">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/40">{T.helpCenter}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: '/support', label: T.support },
                { href: '/faq', label: T.faq },
                { href: '/guide', label: T.gettingStarted },
                { href: '/terms', label: T.termsOfUse },
                { href: '/privacy', label: T.privacyPolicy },
                { href: '/certificates', label: T.certificates },
              ].map((l) => (
                <li key={l.href + l.label}>
                  <a href={l.href} className="text-white/70 transition hover:text-[#E85D04]">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div className="lg:col-span-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/40">{T.contact}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li className="flex items-center gap-2.5"><MapPin size={15} className="shrink-0 text-[#E85D04]" /> {get('footer.address', 'Kigali, Rwanda')}</li>
              <li className="flex items-center gap-2.5"><Phone size={15} className="shrink-0 text-[#E85D04]" /> {get('footer.phone', '0786680301')}</li>
              <li className="flex items-center gap-2.5"><Mail size={15} className="shrink-0 text-[#E85D04]" /> {get('footer.email', 'Enyagasambu@gmail.com')}</li>
            </ul>

            <form onSubmit={subscribe} className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{get('footer.newsletter_title', T.newsletter)}</p>
              <p className="mt-2 text-sm text-white/60">{get('footer.newsletter_desc', T.newsletterDesc)}</p>
              {subscribed ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2.5 text-sm text-green-300 ring-1 ring-green-500/30">
                  <CheckCircle size={16} /> {T.subscribed}
                </div>
              ) : (
                <>
                  <div className="mt-3 flex overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/15 focus-within:ring-2 focus-within:ring-[#E85D04]">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={T.newsletterPlaceholder}
                      className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ background: '#E85D04' }}
                      className="shrink-0 px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? '…' : T.subscribe}
                    </button>
                  </div>
                  {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
                </>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/50 sm:flex-row sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} {get('footer.rights_company', 'Nyagasambu Market Online (NMO)')}. {T.allRights}.</p>
          <div className="flex items-center gap-5">
            <a href="/terms" className="transition hover:text-[#E85D04]">{T.termsOfUse}</a>
            <a href="/privacy" className="transition hover:text-[#E85D04]">{T.privacyPolicy}</a>
            <a href="/faq" className="transition hover:text-[#E85D04]">{T.faq}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
