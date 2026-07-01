'use client';
import Link from 'next/link';

const navy = '#1B2A5E';
const org  = '#E85D04';

interface Member {
  name: string;
  role: string;
  initials: string;
  color: string;
  photo?: string;
  photoPosition?: string;
}

const LEADERSHIP: Member[] = [
  { name: 'Sinonza Polemon',    role: 'Chief Executive Officer',   initials: 'SP', color: navy,       photo: '/polemon.jpg' },
  { name: 'Musinguzi Ronard',   role: 'Chief Information Officer', initials: 'MR', color: '#1a6b3a',  photo: '/ronard.jpg' },
  { name: 'Manishimwe Blaise',  role: 'Chief Operations Officer',  initials: 'MB', color: '#7c3a8a',  photo: '/blaise.jpg' },
  { name: 'Kobusinge Florence', role: 'Chief Marketing Officer',   initials: 'KF', color: '#c04a00',  photo: '/florence.jpg', photoPosition: 'center 20%' },
  { name: 'Tuyishime Eric',     role: 'Chief Financial Officer',   initials: 'TE', color: '#0a6494',  photo: '/eric.jpg' },
];

const BOARD: Member[] = [
  { name: 'Board Member 1', role: 'Chairman of the Board',     initials: 'B1', color: '#374151' },
  { name: 'Board Member 2', role: 'Non-Executive Director',    initials: 'B2', color: '#374151' },
  { name: 'Board Member 3', role: 'Independent Director',      initials: 'B3', color: '#374151' },
  { name: 'Board Member 4', role: 'Board Secretary',           initials: 'B4', color: '#374151' },
];

function Avatar({ member }: { member: Member }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3 overflow-hidden"
        style={{
          width: 140, height: 140,
          background: member.photo ? 'transparent' : member.color,
          border: `3px solid ${member.color}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}
      >
        {member.photo
          ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" style={{ objectPosition: member.photoPosition ?? 'center' }} />
          : member.initials
        }
      </div>
      <p className="font-bold text-base mb-0.5" style={{ color: '#111827' }}>{member.name}</p>
      <p className="text-sm text-gray-500 mb-2">{member.role}</p>
      <div className="w-0.5 h-5 rounded" style={{ background: '#93c5fd' }} />
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="text-white py-16 px-4"
        style={{ background: `linear-gradient(135deg, ${navy} 60%, ${org} 100%)` }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">About E-Nyagasambu</h1>

          <div className="text-base opacity-90 max-w-2xl mx-auto leading-relaxed mb-8 text-left space-y-4">
            <p>
              E-Nyagasambu is a Rwanda-based e-commerce and digital marketplace platform that connects
              buyers, sellers, and service providers directly. Our mission is to simplify commerce by
              creating a trusted space where businesses and individuals can offer products and services
              without relying on intermediaries or brokers.
            </p>
            <p>
              By bringing service providers and customers together on a single platform, E-Nyagasambu
              helps sellers reach more clients, increase visibility, and grow their businesses while
              enabling customers to find quality products and services quickly and conveniently.
            </p>
            <p>
              We are committed to promoting transparency, affordability, and accessibility in the
              digital economy by fostering direct connections between service providers and service
              seekers across Rwanda.
            </p>
          </div>

        </div>
      </section>

      {/* ── Mission ── */}
      <section className="max-w-4xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-6 text-center">
        {[
          { icon: '🎯', title: 'Our Mission',  text: "Digitise Rwanda's local markets and empower every entrepreneur to trade online safely and efficiently." },
          { icon: '👁️', title: 'Our Vision',   text: "To be East Africa's most trusted digital marketplace, driving economic inclusion for all." },
          { icon: '💎', title: 'Our Values',   text: 'Transparency, Trust, Innovation and Community — at the heart of everything we build.' },
        ].map(({ icon, title, text }) => (
          <div key={title} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="font-bold text-sm mb-2" style={{ color: navy }}>{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
          </div>
        ))}
      </section>

      {/* ── Leadership Team ── */}
      <section className="py-12 px-6" style={{ background: '#fafbff' }}>
        <h2 className="text-2xl font-medium text-center mb-2" style={{ color: '#111827' }}>
          Our <span style={{ color: '#3b82f6', fontWeight: 700 }}>Leadership</span> team
        </h2>
        <p className="text-sm text-gray-500 text-center mb-10">
          The people driving E-Nyagasambu's vision forward
        </p>

        {/* Our Team Members */}
        <div className="max-w-5xl mx-auto mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-8 text-center"
            style={{ color: org }}>
            Our Team Members
          </h3>
          <div className="flex flex-wrap justify-center gap-10">
            {LEADERSHIP.map(m => <Avatar key={m.name} member={m} />)}
          </div>
        </div>
      </section>

      {/* ── Board Members ── */}
      <section className="py-12 px-6 bg-white">
        <h2 className="text-2xl font-medium text-center mb-2" style={{ color: '#111827' }}>
          Our <span style={{ color: navy, fontWeight: 700 }}>Board</span> Members
        </h2>
        <p className="text-sm text-gray-500 text-center mb-10">
          Guiding E-Nyagasambu with expertise and governance
        </p>

        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-10">
          {BOARD.map(m => <Avatar key={m.name} member={m} />)}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 italic">
          Board member profiles and photos will be updated shortly.
        </p>
      </section>

      {/* ── How it works summary ── */}
      <section className="py-12 px-6" style={{ background: '#fafbff' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: navy }}>
            How E-Nyagasambu Works
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { step: '01', title: 'Register & Get Coins',       desc: 'Create a free account and receive 100 starter coins instantly.' },
              { step: '02', title: 'Post a Listing',             desc: 'Costs 400 coins. Add photos, price, location and description.' },
              { step: '03', title: 'Browse & Search',            desc: 'Filter by category, keyword or location across all sectors.' },
              { step: '04', title: 'Reveal Seller Contact',      desc: 'Costs 300 coins + OTP verification to protect both parties.' },
              { step: '05', title: 'Boost & Feature',            desc: '200 coins boosts your listing to the top for 7 days.' },
              { step: '06', title: 'Refer & Earn',               desc: 'Share your code — earn coins every time someone joins.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-xl font-black shrink-0 mt-0.5" style={{ color: org }}>{step}</div>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: navy }}>{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners ── */}
      <section className="py-10 px-6 bg-white border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center mb-6 uppercase tracking-widest font-semibold">Our Partners</p>
        <div className="flex flex-wrap justify-center items-center gap-8 max-w-4xl mx-auto">
          {[
            { name: 'RDB',       logo: '/partners/rdb.jpg',       bg: '#fff' },
            { name: 'BNR',       logo: '/partners/bnr.jpg',       bg: '#fff' },
            { name: 'RRA',       logo: '/partners/rra.png',       bg: '#fff' },
            { name: 'MINECOFIN', logo: '/partners/minecofin.svg', bg: '#f0f4f8' },
            { name: 'RSSB',      logo: '/partners/rssb.jpg',      bg: '#fff' },
            { name: 'RPPA',      logo: '/partners/rppa.jpg',      bg: '#fff' },
          ].map(p => (
            <div key={p.name} className="flex flex-col items-center gap-2 group">
              <div className="rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 transition group-hover:shadow-lg group-hover:border-gray-200"
                style={{ width: 120, height: 64, background: p.bg, padding: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logo} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span className="text-xs text-gray-500 font-semibold">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-10 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${navy}, ${org})` }}>
        <h3 className="text-xl font-semibold mb-3">Ready to join E-Nyagasambu?</h3>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/register"
            className="bg-white font-bold px-6 py-2.5 rounded text-sm transition hover:opacity-90"
            style={{ color: navy }}>
            Register Now →
          </Link>
          <Link href="/listings"
            className="border border-white text-white font-medium px-6 py-2.5 rounded text-sm transition hover:bg-white/10">
            Browse Listings
          </Link>
        </div>
      </section>
    </div>
  );
}
