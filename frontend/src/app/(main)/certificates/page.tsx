'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { BadgeCheck, CheckCircle, Clock, Coins, Shield } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface CertType {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'broker' | 'ambassador' | 'supplier';
  price_rwf: number;
  duration_years: number;
}

const CATEGORY_META: Record<string, { title: string; icon: string }> = {
  broker: { title: 'For Brokers', icon: '🧑\u200D\u{1F4BC}' },
  ambassador: { title: 'For Ambassadors', icon: '⭐' },
  supplier: { title: 'For Suppliers', icon: '🏬' },
};

const routeFor = (category: string, userRole: string | undefined, isAuth: boolean) => {
  if (category === 'broker') return isAuth && userRole === 'broker' ? '/broker/certificate' : '/broker/register';
  if (category === 'ambassador') return isAuth && userRole === 'ambassador' ? '/ambassador' : '/register';
  return isAuth && userRole === 'supplier' ? '/supplier' : '/register';
};

const actionFor = (category: string, userRole: string | undefined, isAuth: boolean) => {
  if (category === 'broker') return isAuth && userRole === 'broker' ? 'Get My Certificate →' : 'Register as Broker →';
  if (category === 'ambassador') return isAuth && userRole === 'ambassador' ? 'Go to My Certificate →' : 'Register as Ambassador →';
  return isAuth && userRole === 'supplier' ? 'Go to My Portal →' : 'Register as Supplier →';
};

export default function CertificatesCatalogPage() {
  const { format } = useCurrency();
  const { user } = useAuth();
  const [types, setTypes] = useState<CertType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificate-types')
      .then(({ data }) => setTypes(data.types || []))
      .catch(() => setTypes([]))
      .finally(() => setLoading(false));
  }, []);

  const groups: { category: string; items: CertType[] }[] = [];
  (['broker', 'ambassador', 'supplier'] as const).forEach(cat => {
    const items = types.filter(t => t.category === cat);
    if (items.length) groups.push({ category: cat, items });
  });

  return (
    <div style={{ background: '#f6f8fb', minHeight: '100vh' }}>
      {/* Hero */}
      <section className="text-white px-6 py-16 text-center" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a2d5a 60%, #3a1a2e 100%)` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white" style={{ background: ORG }}>
          <BadgeCheck size={28} />
        </div>
        <h1 className="text-3xl font-extrabold mb-3">Official Certificates</h1>
        <p className="max-w-xl mx-auto text-sm text-white/70">
          Build trust on E-Nyagasambu with an officially verified certificate. Each certificate is paid and issued by our team.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading certificates…</div>
        ) : groups.length === 0 ? (
          <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            No certificates are currently available. Please check back later.
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map(group => (
              <div key={group.category}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{CATEGORY_META[group.category]?.icon}</span>
                  <h2 className="text-lg font-bold text-gray-900">{CATEGORY_META[group.category]?.title}</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map(t => (
                    <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col hover:shadow-lg transition">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${ORG}15` }}>
                        <Shield size={22} style={{ color: NAVY }} />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{t.name}</h3>
                      <p className="text-xs text-gray-500 mt-2 flex-1 leading-relaxed">{t.description}</p>

                      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {t.duration_years} yr{t.duration_years > 1 ? 's' : ''} validity</span>
                        <span className="flex items-center gap-1"><CheckCircle size={12} style={{ color: '#059669' }} /> Verified</span>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1"><Coins size={11} /> Paid certificate</p>
                          <p className="text-lg font-extrabold" style={{ color: NAVY }}>{format(t.price_rwf)}</p>
                        </div>
                        <Link href={routeFor(t.category, user?.role, !!user)}
                          className="text-xs font-bold px-4 py-2.5 rounded-lg text-white transition hover:opacity-90 whitespace-nowrap"
                          style={{ background: ORG }}>
                          {actionFor(t.category, user?.role, !!user)}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="mt-16 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">How it works</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { n: '1', title: 'Choose a certificate', desc: 'Pick the certificate that matches your role on E-Nyagasambu.' },
              { n: '2', title: 'Pay the certificate fee', desc: 'Pay securely by mobile money (MTN MoMo) or bank transfer.' },
              { n: '3', title: 'Admin verification', desc: 'Our team confirms your payment and verifies your details.' },
              { n: '4', title: 'Receive your certificate', desc: 'Your official certificate is issued with a unique verification number.' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-3" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                  {s.n}
                </div>
                <p className="text-sm font-bold text-gray-800">{s.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
