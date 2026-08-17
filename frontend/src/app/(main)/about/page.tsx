'use client';
import Link from 'next/link';
import { Target, Eye, Diamond } from '@/lib/icons';
import { useLanguage } from '@/context/LanguageContext';
import { roleMap } from '@/lib/translations';
import { useSiteContent } from '@/lib/useSiteContent';

const navy = '#0f1e42';
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

interface RegisteredPerson {
  name: string;
  role: string;
  initials: string;
  color: string;
  status: string;
}

const BROKERS: RegisteredPerson[] = [
  { name: 'Mukamana Aline',    role: 'Certified Broker',     initials: 'MA', color: '#1a6b3a', status: 'Verified' },
  { name: 'Habimana Jean',     role: 'Property Broker',      initials: 'HJ', color: '#0a6494', status: 'Verified' },
  { name: 'Uwase Divine',      role: 'Vehicle Broker',       initials: 'UD', color: '#7c3a8a', status: 'Pending' },
  { name: 'Nsengimana Eric',   role: 'General Broker',       initials: 'NE', color: '#c04a00', status: 'Verified' },
  { name: 'Ingabire Sandrine', role: 'Trade Broker',         initials: 'IS', color: '#0f1e42', status: 'Pending' },
];

const AMBASSADORS: RegisteredPerson[] = [
  { name: 'Niyonzima Patrick', role: 'Regional Ambassador', initials: 'NP', color: '#1a6b3a', status: 'Verified' },
  { name: 'Umutesi Grace',     role: 'Community Ambassador', initials: 'UG', color: '#7c3a8a', status: 'Verified' },
  { name: 'Kwizera Samuel',    role: 'Regional Ambassador', initials: 'KS', color: '#0a6494', status: 'Verified' },
  { name: 'Mukandayisenga Jo', role: 'Community Ambassador', initials: 'MJ', color: '#c04a00', status: 'Pending' },
  { name: 'Bizimana Claude',   role: 'Regional Ambassador', initials: 'BC', color: '#0f1e42', status: 'Pending' },
];

const SUPPLIERS: RegisteredPerson[] = [
  { name: 'Gasana Enterprises', role: 'Verified Supplier', initials: 'GE', color: '#0a6494', status: 'Verified' },
  { name: 'Nyiransabimana Ltd', role: 'Product Supplier',   initials: 'NL', color: '#1a6b3a', status: 'Verified' },
  { name: 'Munyaneza Traders',  role: 'Service Supplier',   initials: 'MT', color: '#c04a00', status: 'Pending' },
  { name: 'Uwimana Farm Fresh', role: 'Farm Produce',       initials: 'UF', color: '#7c3a8a', status: 'Verified' },
  { name: 'Kagame Hardware',    role: 'Building Materials', initials: 'KH', color: '#0f1e42', status: 'Pending' },
];

const REGISTERED: RegisteredPerson[] = [...BROKERS, ...AMBASSADORS, ...SUPPLIERS];

function AvatarStack({ people, label, accent, count, countLabel, link, linkLabel }: {
  people: RegisteredPerson[];
  label: string;
  accent: string;
  count: number;
  countLabel: string;
  link: string;
  linkLabel: string;
}) {
  const shown = people.slice(0, 4);
  const extra = count - shown.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
      <div className="flex items-center -space-x-3 mb-4">
        {shown.map((p, i) => (
          <span
            key={`${p.initials}-${i}`}
            className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-sm"
            style={{ background: p.color, zIndex: shown.length - i }}
          >
            {p.initials}
          </span>
        ))}
        {extra > 0 && (
          <span
            className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold shadow-sm"
            style={{ background: '#e5e7eb', color: '#374151' }}
          >
            +{extra}
          </span>
        )}
      </div>

      <p className="font-bold text-sm mb-0.5" style={{ color: '#111827' }}>{label}</p>
      <p className="text-xs mb-4" style={{ color: accent }}>{count} {countLabel}</p>

      <div className="mt-auto">
        <Link href={link} className="text-xs font-bold transition hover:opacity-80" style={{ color: accent }}>
          {linkLabel} →
        </Link>
      </div>
    </div>
  );
}

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
  const { T, lang } = useLanguage();
  const { get } = useSiteContent();
  const tr = (s: string) => roleMap[s]?.[lang] ?? s;

  const LEAD = LEADERSHIP.map(m => ({ ...m, role: tr(m.role) }));
  const BOD  = BOARD.map(m => ({ ...m, role: tr(m.role) }));

  const steps = [
    { step: '01', title: T.aboutStep1Title, desc: T.aboutStep1Desc },
    { step: '02', title: T.aboutStep2Title, desc: T.aboutStep2Desc },
    { step: '03', title: T.aboutStep3Title, desc: T.aboutStep3Desc },
    { step: '04', title: T.aboutStep4Title, desc: T.aboutStep4Desc },
    { step: '05', title: T.aboutStep5Title, desc: T.aboutStep5Desc },
    { step: '06', title: T.aboutStep6Title, desc: T.aboutStep6Desc },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="text-white py-16 px-4"
        style={{ background: `linear-gradient(135deg, ${navy} 60%, ${org} 100%)` }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4 leading-tight text-center">{get('about.title', T.aboutTitle)}</h1>

          <div className="text-base opacity-90 leading-relaxed mb-8 space-y-4 text-left">
            <p>{get('about.intro_1', T.aboutIntro1)}</p>
            <p>{get('about.intro_2', T.aboutIntro2)}</p>
            <p>{get('about.intro_3', T.aboutIntro3)}</p>
          </div>

        </div>
      </section>

      {/* ── Mission ── */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-10 text-center">
        {[
          { icon: <Target size={32} />, title: get('about.mission_title', T.aboutMission), text: get('about.mission_text', T.aboutMissionText) },
          { icon: <Eye size={32} />, title: get('about.vision_title', T.aboutVision), text: get('about.vision_text', T.aboutVisionText) },
          { icon: <Diamond size={32} />, title: get('about.values_title', T.aboutValues), text: get('about.values_text', T.aboutValuesText) },
        ].map(({ icon, title, text }) => (
          <div key={title} className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="mb-4 w-16 h-16 rounded-full flex items-center justify-center text-white"
              style={{ background: `linear-gradient(135deg, ${navy}, ${org})` }}>
              {icon}
            </div>
            <h3 className="font-bold text-base mb-3" style={{ color: navy }}>{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
          </div>
        ))}
      </section>

      {/* ── Leadership Team ── */}
      <section className="py-12 px-6" style={{ background: '#fafbff' }}>
        <h2 className="text-2xl font-medium text-center mb-2" style={{ color: '#111827' }}>
          {T.aboutLeadershipTitle}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-10">
          {T.aboutLeadershipSub}
        </p>

        {/* Our Team Members */}
        <div className="max-w-6xl mx-auto mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-8"
            style={{ color: org }}>
            {T.aboutTeamMembers}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12">
            {LEAD.map(m => <Avatar key={m.name} member={m} />)}
          </div>
        </div>
      </section>

      {/* ── Board Members ── */}
      <section className="py-12 px-6 bg-white">
        <h2 className="text-2xl font-medium text-center mb-2" style={{ color: '#111827' }}>
          {T.aboutBoardTitle}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-10">
          {T.aboutBoardSub}
        </p>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
          {BOD.map(m => <Avatar key={m.name} member={m} />)}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 italic">
          {T.aboutBoardNote}
        </p>
      </section>

      {/* ── Registered Brokers & Ambassadors ── */}
      <section className="py-12 px-6" style={{ background: '#fafbff' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-medium mb-2 text-center" style={{ color: '#111827' }}>
            {T.aboutRegisteredTitle}
          </h2>
          <p className="text-sm text-gray-500 mb-10 text-center">
            {T.aboutRegisteredSub}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <AvatarStack people={BROKERS}     label={T.aboutRegBrokers}     accent={org}     count={BROKERS.length}     countLabel={T.aboutRegistered} link="/broker/register"    linkLabel={T.aboutBecomeBroker} />
            <AvatarStack people={AMBASSADORS} label={T.aboutRegAmbassadors} accent="#3b82f6" count={AMBASSADORS.length} countLabel={T.aboutRegistered} link="/ambassador/register" linkLabel={T.aboutBecomeAmbassador} />
            <AvatarStack people={SUPPLIERS}   label={T.aboutRegSuppliers}   accent="#1a6b3a" count={SUPPLIERS.length}   countLabel={T.aboutRegistered} link="/supplier/register"  linkLabel={T.aboutBecomeSupplier} />
            <AvatarStack people={REGISTERED}  label={T.aboutRegMembers}     accent="#7c3a8a" count={REGISTERED.length}  countLabel={T.aboutRegistered} link="/register"           linkLabel={T.aboutRegisterNow} />
          </div>
        </div>
      </section>

      {/* ── How it works summary ── */}
      <section className="py-12 px-6" style={{ background: '#fafbff' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: navy }}>
            {get('about.how_title', T.aboutHowTitle)}
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {steps.map(({ step, title, desc }) => (
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
        <p className="text-xs text-gray-400 text-center mb-6 uppercase tracking-widest font-semibold">{get('about.partners_title', T.aboutPartners)}</p>
        <div className="flex flex-wrap justify-center items-center gap-8 max-w-4xl mx-auto">
          {[
            { name: 'KBL', logo: '/partners/kbl.png', bg: '#fff', label: 'Kigali Business Lab' },
          ].map(p => (
            <div key={p.name} className="flex flex-col items-center gap-2 group">
              <div className="rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 transition group-hover:shadow-lg group-hover:border-gray-200"
                style={{ width: 120, height: 64, background: p.bg, padding: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logo} alt={p.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span className="text-xs text-gray-500 font-semibold">{p.label}</span>
            </div>
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`slot-${i}`} className="flex flex-col items-center gap-2">
              <div className="rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center"
                style={{ width: 120, height: 64 }}>
                <span className="text-xs text-gray-300 font-semibold">Partner</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-10 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${navy}, ${org})` }}>
        <h3 className="text-xl font-semibold mb-3">{get('about.cta_title', T.aboutCtaTitle)}</h3>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/register"
            className="bg-white font-bold px-6 py-2.5 rounded text-sm transition hover:opacity-90"
            style={{ color: navy }}>
            {T.aboutCtaRegister} →
          </Link>
          <Link href="/listings"
            className="border border-white text-white font-medium px-6 py-2.5 rounded text-sm transition hover:bg-white/10">
            {T.aboutCtaBrowse}
          </Link>
        </div>
      </section>
    </div>
  );
}
