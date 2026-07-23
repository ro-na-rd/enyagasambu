'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Package, Building2, Car, CheckCircle, Handshake, Lock, Wrench, BadgeCheck, Coins, Mail, Phone, Users, List, Plus, Search, Send, Award, MapPin, Clock } from '@/lib/icons';
import { SITE_DOMAIN } from '@/lib/config';

const NAVY = '#0f1e42';
const ORG  = '#E85D04';
const GOLD = '#C9A227';

const authorizedServices = [
  { label: 'Product Brokerage', desc: 'Facilitate buying & selling of goods', icon: <Package size={18} /> },
  { label: 'Property Brokerage', desc: 'Connect buyers & sellers of real estate', icon: <Building2 size={18} /> },
  { label: 'Vehicle Brokerage', desc: 'Arrange deals for cars, bikes & more', icon: <Car size={18} /> },
  { label: 'Marketplace Verification', desc: 'Verify listings & ensure trust', icon: <CheckCircle size={18} /> },
  { label: 'Customer Support', desc: 'Assist clients through transactions', icon: <Handshake size={18} /> },
];

/* ── Ambassador cert helpers (view-only, no print) ─────── */
const CERT_W = 860;

function CertCorner({ pos }: { pos: 'tl'|'tr'|'bl'|'br' }) {
  const W = 110, H = 110;
  const pts: Record<string,string> = {
    tl:`0,0 ${W},0 0,${H}`, tr:`${W},0 ${W},${H} 0,0`,
    bl:`0,0 0,${H} ${W},${H}`, br:`${W},0 0,${H} ${W},${H}`,
  };
  const ds: Record<string,[number,number][]> = {
    tl:[[10,48],[20,26],[38,12],[56,16],[68,38],[32,40],[16,66],[44,58],[7,80]],
    tr:[[W-10,48],[W-20,26],[W-38,12],[W-56,16],[W-68,38],[W-32,40],[W-16,66],[W-44,58],[W-7,80]],
    bl:[[10,H-48],[20,H-26],[38,H-12],[56,H-16],[68,H-38],[32,H-40],[16,H-66],[44,H-58],[7,H-80]],
    br:[[W-10,H-48],[W-20,H-26],[W-38,H-12],[W-56,H-16],[W-68,H-38],[W-32,H-40],[W-16,H-66],[W-44,H-58],[W-7,H-80]],
  };
  const c: Record<string,React.CSSProperties> = { tl:{top:0,left:0},tr:{top:0,right:0},bl:{bottom:0,left:0},br:{bottom:0,right:0} };
  return (
    <div style={{ position:'absolute', width:W, height:H, overflow:'hidden', zIndex:1, pointerEvents:'none', ...c[pos] }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polygon points={pts[pos]} fill={NAVY}/>
        {ds[pos].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="2.8" fill="rgba(255,255,255,0.38)"/>)}
        {pos==='tl'&&<line x1="0" y1={H+4} x2={W+4} y2="0" stroke={ORG} strokeWidth="3" opacity="0.9"/>}
        {pos==='tr'&&<line x1="-4" y1="0" x2={W} y2={H+4} stroke={ORG} strokeWidth="3" opacity="0.9"/>}
        {pos==='bl'&&<line x1="-4" y1={H} x2={W} y2="-4" stroke={ORG} strokeWidth="3" opacity="0.9"/>}
        {pos==='br'&&<line x1="0" y1="-4" x2={W+4} y2={H} stroke={ORG} strokeWidth="3" opacity="0.9"/>}
      </svg>
    </div>
  );
}

function CertBadge() {
  return (
    <svg width="105" height="120" viewBox="0 0 120 135">
      <circle cx="60" cy="62" r="56" fill={GOLD}/>
      <circle cx="60" cy="62" r="49" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3.5 2.5"/>
      <circle cx="60" cy="62" r="41" fill={NAVY}/>
      <polygon points="60,14 63.5,25 75,25 65.5,32 69,43 60,36 51,43 54.5,32 45,25 56.5,25" fill={GOLD}/>
      <text x="60" y="51" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="Arial">OFFICIAL</text>
      <text x="60" y="64" textAnchor="middle" fill={ORG} fontSize="12" fontWeight="900" fontFamily="Arial Black,Arial">BRAND</text>
      <text x="60" y="77" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="Arial">AMBASSADOR</text>
      <polygon points="30,105 60,92 90,105 90,135 60,122 30,135" fill={ORG}/>
    </svg>
  );
}

function CertStamp() {
  return (
    <svg width="80" height="80" viewBox="0 0 92 92">
      <circle cx="46" cy="46" r="44" fill="none" stroke={NAVY} strokeWidth="2"/>
      <circle cx="46" cy="46" r="37" fill="none" stroke={NAVY} strokeWidth="1" strokeDasharray="3 2"/>
      <path id="dArcTop" d="M 8,46 A 38,38 0 1 1 84,46" fill="none"/>
      <text fontSize="7" fontFamily="Arial" fontWeight="bold" fill={NAVY}>
        <textPath href="#dArcTop" startOffset="5%">E-NYAGASAMBU LTD • DIGITAL MARKET PLACE</textPath>
      </text>
      <text x="46" y="53" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="Arial Black,Arial" fill={NAVY}>E</text>
      <text x="46" y="64" textAnchor="middle" fontSize="6" fontFamily="Arial" fill={NAVY}>KIGALI, RWANDA</text>
    </svg>
  );
}

function CertSig({ name, title }: { name: string; title: string }) {
  return (
    <div style={{ textAlign:'center', minWidth:110 }}>
      <div style={{ fontFamily:"'Dancing Script',cursive,Georgia", fontSize:22, color:NAVY, lineHeight:1, marginBottom:3 }}>{name}</div>
      <div style={{ borderTop:`1.5px solid #555`, width:110, margin:'0 auto 3px' }}/>
      <div style={{ fontSize:9, fontWeight:700, color:NAVY }}>{title}</div>
      <div style={{ fontSize:8, color:'#777' }}>E-Nyagasambu Ltd</div>
    </div>
  );
}

function AmbassadorCertView({ name, certNo, issued, validUntil, qr }: {
  name:string; certNo:string; issued:string; validUntil:string; qr:string;
}) {
  return (
    <div style={{ position:'relative', width:CERT_W, background:'#fff', fontFamily:'Arial,Helvetica,sans-serif', overflow:'hidden', margin:'0 auto', border:'1px solid #e5e7eb' }}>
      <CertCorner pos="tl"/><CertCorner pos="tr"/><CertCorner pos="bl"/><CertCorner pos="br"/>
      <div style={{ position:'absolute', top:0, left:14, bottom:0, width:3, background:`linear-gradient(180deg,${ORG} 0%,transparent 30%,transparent 70%,${ORG} 100%)`, zIndex:1, opacity:0.6 }}/>
      <div style={{ position:'absolute', top:0, right:14, bottom:0, width:3, background:`linear-gradient(180deg,${ORG} 0%,transparent 30%,transparent 70%,${ORG} 100%)`, zIndex:1, opacity:0.6 }}/>

      <div style={{ position:'relative', zIndex:2, padding:'22px 38px 20px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:160 }}>
            <div style={{ width:50, height:50, borderRadius:'50%', border:`2px solid ${ORG}`, display:'flex', alignItems:'center', justifyContent:'center', background:NAVY }}>
              <svg viewBox="0 0 50 50" width="48" height="48">
                <circle cx="25" cy="25" r="23" fill={NAVY}/>
                <text x="8" y="38" fontSize="30" fontWeight="900" fontFamily="Arial Black,Arial" fill="#fff">E</text>
                <path d="M30 31 L36 31 L37.5 27 L28.5 27" fill="none" stroke={ORG} strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="29" cy="33" r="1.4" fill={ORG}/><circle cx="35" cy="33" r="1.4" fill={ORG}/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:13, color:NAVY, letterSpacing:2 }}>E-NYAGASAMBU</div>
              <div style={{ fontSize:8, color:ORG, letterSpacing:1.5, fontWeight:700 }}>DIGITAL MARKET PLACE</div>
              <div style={{ fontSize:7.5, color:'#666' }}>www.{SITE_DOMAIN}</div>
            </div>
          </div>

          <div style={{ textAlign:'center', flex:1 }}>
            <div style={{ fontSize:32, fontWeight:900, color:NAVY, letterSpacing:6, lineHeight:1 }}>CERTIFICATE</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', margin:'4px 0 2px' }}>
              <div style={{ height:2, width:34, background:NAVY }}/>
              <span style={{ fontSize:12, color:ORG, fontWeight:700, letterSpacing:1.5 }}>• OF APPOINTMENT •</span>
              <div style={{ height:2, width:34, background:NAVY }}/>
            </div>
            <div style={{ fontSize:10, color:'#666', marginTop:8 }}>This Certificate is Proudly Awarded To</div>
          </div>

          <div style={{ minWidth:130, textAlign:'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR" width={72} height={72} style={{ border:'1px solid #ccc', display:'block', margin:'0 auto' }}/>
            <div style={{ fontSize:7, color:'#999', marginBottom:6 }}>SCAN TO VERIFY</div>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:7, color:'#999' }}>Certificate No.</div>
              <div style={{ background:NAVY, color:'#fff', padding:'2px 6px', fontSize:8, fontWeight:700, borderRadius:2, display:'inline-block', marginBottom:4 }}>{certNo}</div>
              <div style={{ fontSize:7, color:'#999' }}>Issue Date</div>
              <div style={{ fontSize:9, fontWeight:700, color:NAVY, marginBottom:2 }}>{issued}</div>
              <div style={{ fontSize:7, color:'#999' }}>Valid Until</div>
              <div style={{ fontSize:9, fontWeight:700, color:NAVY }}>{validUntil}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          <div style={{ flexShrink:0, marginTop:2 }}><CertBadge/></div>

          <div style={{ flex:1, textAlign:'center' }}>
            <div style={{ fontFamily:"'Dancing Script',cursive,Georgia", fontSize:44, color:NAVY, lineHeight:1.1, marginBottom:2 }}>{name}</div>
            <div style={{ height:2, background:`linear-gradient(to right,transparent,${ORG},transparent)`, width:'65%', margin:'0 auto 6px' }}/>
            <div style={{ fontSize:10, color:'#666' }}>For being officially appointed as a</div>
            <div style={{ fontSize:26, fontWeight:900, color:ORG, letterSpacing:2, margin:'2px 0' }}>BRAND AMBASSADOR</div>
            <div style={{ fontSize:12, color:NAVY, fontWeight:600, marginBottom:6 }}>of E-Nyagasambu Digital Marketplace</div>
            <div style={{ fontSize:9.5, color:'#666', lineHeight:1.6, maxWidth:360, margin:'0 auto 10px' }}>
              In recognition of your commitment to promoting digital commerce, supporting local businesses,
              onboarding users, and representing the values and mission of E-Nyagasambu.
            </div>
            <div style={{ display:'flex', justifyContent:'center', borderTop:'1px dashed #ccc', borderBottom:'1px dashed #ccc', padding:'6px 0', margin:'0 0 10px' }}>
              {[
                { icon:<MapPin size={8} />, label:'AUTHORIZED TERRITORY', val:'Kigali City' },
                { icon:<Clock size={8} />, label:'ISSUE DATE', val:issued },
                { icon:<Clock size={8} />, label:'VALID UNTIL', val:validUntil },
              ].map(({ icon, label, val }, i) => (
                <div key={label} style={{ flex:1, textAlign:'center', borderRight:i<2?'1px dashed #ccc':'none', padding:'0 10px' }}>
                  <div style={{ fontSize:8, color:ORG, fontWeight:700 }}>{icon} {label}</div>
                  <div style={{ fontSize:10, color:NAVY, fontWeight:600, marginTop:2 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-end' }}>
              <CertSig name="Amdin" title="Platform Director"/>
              <CertStamp/>
              <CertSig name="Jan" title="Business Development Officer"/>
            </div>
          </div>

          <div style={{ flexShrink:0, width:155 }}>
            <div style={{ border:`2px solid ${NAVY}`, borderRadius:6, overflow:'hidden' }}>
              <div style={{ background:NAVY, color:'#fff', fontWeight:700, fontSize:9, padding:'5px 9px', textAlign:'center', letterSpacing:1.5 }}>RESPONSIBILITIES</div>
              <div style={{ padding:'8px 10px' }}>
                {['Promote E-Nyagasambu services','Recruit suppliers and vendors','Support user onboarding','Conduct awareness campaigns','Represent the platform professionally','Uphold E-Nyagasambu policies'].map(r=>(
                  <div key={r} style={{ display:'flex', gap:5, alignItems:'flex-start', marginBottom:5 }}>
                    <span style={{ color:ORG, fontWeight:900, fontSize:11, lineHeight:1.3, flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:8.5, color:'#333', lineHeight:1.3 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MyListing {
  id: number;
  title: string;
  price: number | null;
  price_type: string;
  listing_type: string;
  category_name: string;
  status: string;
  expires_at: string;
  primary_image: string | null;
}

interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  bonusPaid: number;
}

interface PlatformStats {
  totalUsers: number;
  activeListings: number;
  totalListings: number;
  totalUnlocks: number;
  coinsEarned: number;
  coinsFromListings: number;
  coinsFromBoosts: number;
}

const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  admin:   { label: 'Admin',   bg: '#fee2e2', color: '#b91c1c' },
  staff:   { label: 'Staff',   bg: '#dbeafe', color: '#1d4ed8' },
  user:    { label: 'Member',  bg: '#f0fdf4', color: '#15803d' },
  seller:  { label: 'Seller',  bg: '#fff7ed', color: '#c2410c' },
};

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [listings, setListings]         = useState<MyListing[]>([]);
  const [referral, setReferral]         = useState<ReferralInfo | null>(null);
  const [stats, setStats]               = useState<PlatformStats | null>(null);
  const [recentUsers, setRecentUsers]   = useState<{ id:number; name:string; email:string; coins:number }[]>([]);
  const [recentListings, setRecentListings] = useState<{ id:number; title:string; status:string; seller_name:string }[]>([]);
  const [fetching, setFetching]         = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const isPriv = user.role === 'admin' || user.role === 'staff';

    Promise.allSettled([
      api.get('/listings/my'),
      api.get('/referrals/me'),
      isPriv ? api.get('/admin/stats') : Promise.resolve(null),
    ]).then(([listRes, refRes, statsRes]) => {
      if (listRes.status === 'fulfilled') setListings(listRes.value?.data?.listings ?? []);
      if (refRes.status === 'fulfilled')  setReferral(refRes.value?.data ?? null);
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value.data.stats);
        setRecentUsers(statsRes.value.data.recentUsers ?? []);
        setRecentListings(statsRes.value.data.recentListings ?? []);
      }
    }).finally(() => setFetching(false));
  }, [user]);

  /* cert data */
  const certYear = new Date().getFullYear();
  const certNo   = `ENA-AMB-${certYear}-${String(user?.id ?? 0).padStart(4, '0')}`;
  const certIssued   = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const certValidUntil = new Date(certYear + 1, new Date().getMonth(), new Date().getDate())
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const certQr = user
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://${SITE_DOMAIN}/verify/${certNo}`)}&bgcolor=ffffff&color=1B2A5E&margin=4`
    : '';

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f2f9' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-black text-2xl shadow-lg"
            style={{ background: NAVY }}>E</div>
          <p className="text-gray-500 text-sm animate-pulse">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const badge   = ROLE_BADGE[user.role] ?? ROLE_BADGE.user;
  const isPriv  = user.role === 'admin' || user.role === 'staff';
  const initials = user.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const joinDate = ''; // not in token, so we skip
  const myActive = listings.filter(l => l.status === 'active').length;

  return (
    <div className="min-h-screen" style={{ background: '#f0f2f9' }}>

      {/* ── Top gradient header ── */}
      <div className="text-white px-6 py-8"
        style={{ background: `linear-gradient(135deg, ${NAVY} 55%, ${ORG} 130%)` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-60 mb-0.5">E-Nyagasambu</p>
            <h1 className="text-2xl font-extrabold leading-tight">My Account</h1>
            <p className="opacity-75 text-sm mt-0.5">
              Welcome back, <strong>{user.name}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isPriv && (
              <Link href="/staff"
                className="text-sm font-semibold px-4 py-2 rounded-lg transition border border-white/40 bg-white/10 hover:bg-white/20">
                {user.role === 'admin' ? <><Lock size={14} /> Admin Panel</> : <><Wrench size={14} /> Staff Panel</>}
              </Link>
            )}
            <button onClick={() => { logout(); router.push('/'); }}
              className="text-sm px-4 py-2 rounded-lg transition border border-white/30 hover:bg-white/10 opacity-75 hover:opacity-100">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">

        {/* ── SIDEBAR ── */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-4 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ background: NAVY, color: '#fff' }}>
                My Roles / Services
              </div>
              <div className="divide-y divide-gray-50">
                {authorizedServices.map((s) => (
                  <div key={s.label} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ background: `linear-gradient(135deg, ${NAVY}10, ${ORG}10)` }}>
                      {s.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 group-hover:text-[#E85D04] transition truncate">{s.label}</p>
                      <p className="text-[10px] text-gray-400 leading-tight truncate">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg mx-auto mb-2"
                style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})`, color: '#fff' }}>
                <BadgeCheck size={28} />
              </div>
              <p className="text-xs font-bold text-gray-800">Certified Broker</p>
              <p className="text-[10px] text-gray-400 mt-0.5">E-Nyagasambu Digital Marketplace</p>
              <Link href="/certificate" className="inline-block mt-3 text-[10px] font-bold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition"
                style={{ background: ORG }}>
                View Certificate →
              </Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 space-y-8">

        {/* ── ACCOUNT PROFILE ── */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
          <div className="h-24" style={{ background: `linear-gradient(90deg, ${NAVY}, ${ORG})` }}/>
          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-extrabold text-2xl border-4 border-white shadow-lg mb-4"
                style={{ background: NAVY }}>
                {initials}
              </div>
              <p className="text-xl font-extrabold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-400 mb-2">{user.email}</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div className="rounded-xl p-4 text-center border border-gray-100" style={{ background: '#fff7ed' }}>
                <p className="text-xs text-gray-500 mb-1">Coin Balance</p>
                <p className="text-2xl font-extrabold" style={{ color: ORG }}><Coins size={20} /> {(user.coins ?? 0).toLocaleString()}</p>
              </div>
              <div className="rounded-xl p-4 text-center border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Total Listings</p>
                <p className="text-2xl font-extrabold" style={{ color: NAVY }}>{listings.length}</p>
              </div>
              <div className="rounded-xl p-4 text-center border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Active Listings</p>
                <p className="text-2xl font-extrabold" style={{ color: NAVY }}>{myActive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACCOUNT DETAILS ── */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: NAVY }}>
            Account Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: <Mail size={16} />, label: 'Email',         val: user.email },
              { icon: <Phone size={16} />, label: 'Phone',         val: user.phone || 'Not set' },
              { icon: <Users size={16} />, label: 'Role',          val: badge.label },
              { icon: <Coins size={16} />, label: 'Coins',         val: (user.coins ?? 0).toLocaleString() },
              { icon: <List size={16} />, label: 'Total Listings',val: String(listings.length) },
              { icon: <CheckCircle size={16} />, label: 'Active',        val: String(myActive) },
            ].map(({ icon, label, val }) => (
              <div key={label} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50">
                <span className="text-sm text-gray-600 flex items-center gap-2">{icon}{label}</span>
                <span className="text-sm font-semibold text-gray-900">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── REFERRAL CODE ── */}
        {referral && (
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: NAVY }}>
              Refer & Earn
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-extrabold" style={{ color: ORG }}>{referral.totalReferrals}</p>
                  <p className="text-xs text-gray-500">Referrals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold" style={{ color: ORG }}>{referral.bonusPaid}</p>
                  <p className="text-xs text-gray-500">Coins Earned</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <code className="flex-1 bg-gray-100 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-center tracking-widest" style={{ color: NAVY }}>
                  {referral.referralCode}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referral.referralCode}`)}
                  className="text-white text-sm font-bold px-4 py-2.5 rounded-lg transition hover:opacity-90"
                  style={{ background: ORG }}>
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MY LISTINGS ── */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: NAVY }}>
              My Listings
              {listings.length > 0 && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#e8ecf8', color: NAVY }}>
                  {listings.length}
                </span>
              )}
            </h2>
            <Link href="/my-listings" className="text-xs font-semibold hover:underline" style={{ color: ORG }}>
              View all →
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <div className="mb-2 flex justify-center"><Package size={32} /></div>
              <p className="text-sm font-semibold text-gray-700 mb-1">No listings yet</p>
              <p className="text-xs text-gray-400 mb-4">Post your first listing and start selling</p>
              <Link href="/listings/create"
                className="text-white text-xs font-bold px-5 py-2.5 rounded-lg transition hover:opacity-90"
                style={{ background: ORG }}>
                Post Listing →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {listings.slice(0, 5).map(l => (
                <Link key={l.id} href={`/listings/${l.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-gray-50 transition rounded-lg px-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                    {l.primary_image
                      ? <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${l.primary_image}`} alt="" className="w-full h-full object-cover"/>
                      : <Package size={20} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                       {l.category_name} · {l.price != null ? `${Number(l.price).toLocaleString()} RWF` : l.price_type}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                    l.status === 'active'
                      ? 'bg-green-50 text-green-700'
                      : l.status === 'expired'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>{l.status}</span>
                </Link>
              ))}
              {listings.length > 5 && (
                <Link href="/my-listings"
                  className="flex items-center justify-center py-3 text-xs font-semibold hover:bg-gray-50 transition rounded-lg"
                  style={{ color: ORG }}>
                  + {listings.length - 5} more listings →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/listings/create', icon: <Plus size={24} />, label: 'Post a Listing',   sub: 'Costs 400 coins' },
            { href: '/coins',           icon: <Coins size={24} />, label: 'Buy Coins',        sub: 'Top up wallet' },
            { href: '/listings',        icon: <Search size={24} />, label: 'Browse Listings',  sub: 'Find products' },
            { href: '/referral',        icon: <Send size={24} />, label: 'Invite Friends',   sub: 'Earn 200 RWF per cert' },
          ].map(({ href, icon, label, sub }) => (
            <Link key={href} href={href}
              className="bg-white rounded-xl border-2 border-gray-100 p-4 flex flex-col items-center text-center hover:shadow-md transition group"
              onMouseEnter={e => (e.currentTarget.style.borderColor = ORG)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
              <span className="mb-1.5">{icon}</span>
              <p className="text-xs font-bold text-gray-800">{label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </Link>
          ))}
        </div>

        {/* ── STAFF/ADMIN: Platform stats ── */}
        {isPriv && stats && (
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: NAVY }}>
              Platform Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Users',     value: stats.totalUsers,      icon: <Users size={22} />, bg: NAVY },
                { label: 'Active Listings', value: stats.activeListings,  icon: <List size={22} />, bg: ORG },
                { label: 'Connects Made',   value: stats.totalUnlocks,    icon: <Phone size={22} />, bg: '#7c3aed' },
                { label: 'Coins Collected', value: (stats.coinsEarned||0)+(stats.coinsFromListings||0)+(stats.coinsFromBoosts||0), icon: <Coins size={22} />, bg: '#059669' },
              ].map(card => (
                <div key={card.label} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="mb-1 flex justify-center">{card.icon}</div>
                  <p className="text-lg font-extrabold" style={{ color: card.bg }}>
                    {(card.value ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AMBASSADOR DASHBOARD LINK ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: NAVY }}><Award size={16} /> Ambassador Program</h2>
              <p className="text-xs text-gray-400 mt-1">Track referrals, earnings, and rewards</p>
            </div>
            <Link href="/ambassador"
              className="text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 transition"
              style={{ background: ORG }}>
              Go to Ambassador Dashboard →
            </Link>
          </div>
        </div>

        {/* ── AMBASSADOR CERTIFICATE ── */}
        <section id="ambassador-cert">
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');`}</style>
          <div className="flex items-center gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: NAVY }}>
                <Award size={16} /> Ambassador Certificate
              </h2>
            </div>
          </div>
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <AmbassadorCertView
              name={user.name}
              certNo={certNo}
              issued={certIssued}
              validUntil={certValidUntil}
              qr={certQr}
            />
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
