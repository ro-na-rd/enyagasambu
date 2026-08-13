'use client';
import { SITE_DOMAIN, SITE_URL } from '@/lib/config';

const NAVY = '#0f1e42';
const ORG = '#E85D04';
const GOLD = '#c9a227';
const GOLD_DARK = '#a8841a';

const RESPONSIBILITIES = [
  'Promote E-Nyagasambu services',
  'Recruit suppliers and vendors',
  'Support user onboarding',
  'Conduct awareness campaigns',
  'Represent the platform professionally',
  'Uphold E-Nyagasambu policies',
];

const W = 1000;
const H = 700;

function BrandLogo({ scale = 1 }: { scale?: number }) {
  const s = scale;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 * s }}>
      <svg width={52 * s} height={52 * s} viewBox="0 0 52 52" aria-hidden>
        <circle cx="26" cy="26" r="25" fill={NAVY} stroke={ORG} strokeWidth="1.5" />
        <text x="8" y="36" fontSize="28" fontWeight="900" fontFamily="Arial Black,Arial,sans-serif" fill="#fff">E</text>
        <g transform="translate(24,18) scale(0.85)">
          <path d="M1 1h3.4l2.2 11.3a2 2 0 0 0 2 1.7h9.6a2 2 0 0 0 2-1.6L22.6 5.5H5" stroke={ORG} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="17" r="1.3" stroke={ORG} strokeWidth="1.7" fill="none" />
          <circle cx="16" cy="17" r="1.3" stroke={ORG} strokeWidth="1.7" fill="none" />
        </g>
        <path d="M38 8 L42 4 L44 10 L50 12 L44 14 L42 20 L38 14 L32 12 Z" fill={ORG} opacity="0.9" />
      </svg>
      <div>
        <div style={{ fontSize: 15 * s, fontWeight: 900, color: NAVY, letterSpacing: 1.2, lineHeight: 1.1 }}>E-NYAGASAMBU</div>
        <div style={{ fontSize: 8.5 * s, color: ORG, letterSpacing: 2, fontWeight: 700 }}>DIGITAL MARKET PLACE</div>
        <div style={{ fontSize: 7.5 * s, color: NAVY, marginTop: 2 * s }}>www.{SITE_DOMAIN}</div>
      </div>
    </div>
  );
}

function CornerDecorations() {
  return (
    <>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: 200, height: 160, pointerEvents: 'none' }} viewBox="0 0 200 160" aria-hidden>
        <path d="M0,0 L200,0 L200,80 Q120,100 0,160 Z" fill={NAVY} />
        <path d="M0,0 L140,0 Q80,40 0,100 Z" fill={ORG} opacity="0.85" />
      </svg>
      <svg style={{ position: 'absolute', top: 0, right: 0, width: 180, height: 140, pointerEvents: 'none' }} viewBox="0 0 180 140" aria-hidden>
        <path d="M180,0 L0,0 L0,70 Q60,90 180,140 Z" fill={NAVY} />
        <path d="M180,0 L40,0 Q100,35 180,90 Z" fill={ORG} opacity="0.85" />
      </svg>
      <svg style={{ position: 'absolute', bottom: 0, right: 0, width: 220, height: 150, pointerEvents: 'none' }} viewBox="0 0 220 150" aria-hidden>
        <path d="M220,150 L220,0 L110,0 Q160,60 220,150 Z" fill={NAVY} />
        <path d="M220,150 L220,40 Q150,80 220,150 Z" fill={ORG} opacity="0.85" />
      </svg>
    </>
  );
}

function WavyBackground() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }} preserveAspectRatio="none" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          key={i}
          d={`M0,${80 + i * 70} Q250,${50 + i * 70} 500,${80 + i * 70} T1000,${80 + i * 70}`}
          fill="none"
          stroke={NAVY}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function OfficialSeal() {
  return (
    <div style={{ position: 'relative', width: 140, height: 160, flexShrink: 0 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
        <defs>
          <radialGradient id="sealGold" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f7d670" />
            <stop offset="100%" stopColor={GOLD_DARK} />
          </radialGradient>
        </defs>
        {Array.from({ length: 28 }).map((_, i) => {
          const angle = (i * 360) / 28;
          const rad = (angle * Math.PI) / 180;
          const x1 = 70 + Math.cos(rad) * 59;
          const y1 = 70 + Math.sin(rad) * 59;
          const x2 = 70 + Math.cos(rad) * 66;
          const y2 = 70 + Math.sin(rad) * 66;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD_DARK} strokeWidth="2" />;
        })}
        <circle cx="70" cy="70" r="56" fill="url(#sealGold)" stroke={GOLD_DARK} strokeWidth="2" />
        <circle cx="70" cy="70" r="48" fill="none" stroke={GOLD_DARK} strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="70" cy="70" r="40" fill="none" stroke={GOLD_DARK} strokeWidth="1" />
        <path d="M70,30 C90,30 90,60 70,60 C50,60 50,30 70,30 Z" fill={GOLD_DARK} opacity="0.08" />
        <path d="M32,70 Q70,40 108,70 Q70,100 32,70" fill="none" stroke={GOLD_DARK} strokeWidth="1.2" />
        <text x="70" y="56" textAnchor="middle" fontSize="8" fontWeight="800" fill={NAVY} fontFamily="Arial,sans-serif">OFFICIAL</text>
        <text x="70" y="68" textAnchor="middle" fontSize="8" fontWeight="800" fill={NAVY} fontFamily="Arial,sans-serif">BRAND</text>
        <text x="70" y="80" textAnchor="middle" fontSize="8" fontWeight="800" fill={NAVY} fontFamily="Arial,sans-serif">AMBASSADOR</text>
      </svg>
      <svg width="140" height="30" viewBox="0 0 140 30" style={{ position: 'absolute', bottom: 0, left: 0 }} aria-hidden>
        <path d="M40,0 L52,24 L64,0 Z" fill={ORG} />
        <path d="M88,0 L100,24 L112,0 Z" fill={ORG} />
      </svg>
    </div>
  );
}

function CorporateStamp() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden>
      <circle cx="45" cy="45" r="42" fill="none" stroke={NAVY} strokeWidth="2" />
      <circle cx="45" cy="45" r="36" fill="none" stroke={ORG} strokeWidth="1" />
      <text x="45" y="22" textAnchor="middle" fontSize="5.5" fontWeight="700" fill={NAVY} fontFamily="Arial,sans-serif">E-NYAGASAMBU LTD</text>
      <text x="45" y="30" textAnchor="middle" fontSize="4.5" fontWeight="600" fill={ORG} fontFamily="Arial,sans-serif">DIGITAL MARKET PLACE</text>
      <circle cx="45" cy="48" r="14" fill={NAVY} />
      <text x="45" y="53" textAnchor="middle" fontSize="16" fontWeight="900" fill="#fff" fontFamily="Arial Black,Arial,sans-serif">E</text>
      <text x="45" y="72" textAnchor="middle" fontSize="4.5" fontWeight="600" fill={NAVY} fontFamily="Arial,sans-serif">KIGALI · RWANDA</text>
    </svg>
  );
}

function AmbassadorBadge() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      borderRadius: 999,
      border: `1px solid ${NAVY}`,
      background: '#f7f9ff',
      padding: '10px 14px',
      boxShadow: '0 12px 36px rgba(15, 30, 66, 0.08)',
      maxWidth: 320,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: ORG,
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        OFFICIAL
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: NAVY, letterSpacing: 1.3 }}>BRAND</span>
        <span style={{ fontSize: 14, fontWeight: 900, color: NAVY, letterSpacing: 0.6 }}>AMBASSADOR</span>
      </div>
    </div>
  );
}

function SignatureLine({ title }: { title: string }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <svg width="120" height="36" viewBox="0 0 120 36" aria-hidden>
        <path d="M8,28 C25,10 40,32 55,18 S85,8 112,24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{ borderTop: `1px solid ${NAVY}`, marginTop: 2, paddingTop: 4 }}>
        <p style={{ fontSize: 8, color: NAVY, margin: 0, fontWeight: 600 }}>{title}</p>
      </div>
    </div>
  );
}

function InfoIcon({ type }: { type: 'location' | 'calendar' }) {
  if (type === 'location') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill={ORG} aria-hidden>
        <path d="M7 1C4.24 1 2 3.24 2 6c0 3.75 5 7 5 7s5-3.25 5-7c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 1 1 7 4a1.5 1.5 0 0 1 0 3z" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill={ORG} aria-hidden>
      <rect x="2" y="3" width="10" height="9" rx="1" stroke={ORG} strokeWidth="1" fill="none" />
      <line x1="2" y1="5.5" x2="12" y2="5.5" stroke={ORG} strokeWidth="1" />
      <line x1="4.5" y1="1.5" x2="4.5" y2="4" stroke={ORG} strokeWidth="1.2" />
      <line x1="9.5" y1="1.5" x2="9.5" y2="4" stroke={ORG} strokeWidth="1.2" />
    </svg>
  );
}

export interface AmbassadorCertificateProps {
  name: string;
  certNo?: string;
  issued: string;
  validUntil: string;
  territory?: string;
  id?: string;
  className?: string;
}

export default function AmbassadorCertificate({
  name,
  certNo = 'ENA-AMB-2026-0001',
  issued,
  validUntil,
  territory = 'Kigali City',
  id = 'ambassador-cert-print',
  className,
}: AmbassadorCertificateProps) {
  const verifyUrl = `${SITE_URL}/verify/${certNo}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`;

  return (
    <div
      id={id}
      className={className}
      style={{
        width: '100%',
        maxWidth: W,
        aspectRatio: `${W} / ${H}`,
        margin: '0 auto',
        position: 'relative',
        background: '#fff',
        overflow: 'hidden',
        fontFamily: 'Arial,Helvetica,sans-serif',
        boxShadow: '0 4px 36px rgba(0,0,0,0.18)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onContextMenu={e => e.preventDefault()}
    >
      <CornerDecorations />
      <WavyBackground />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 2, padding: '28px 36px 24px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 260 }}>
            <BrandLogo />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, borderRadius: 28, border: `1px solid ${NAVY}`, background: '#f7f9ff', padding: '12px 18px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: ORG, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>OFFICIAL</div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: NAVY, letterSpacing: 1.4 }}>BRAND</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: NAVY, letterSpacing: 0.8 }}>AMBASSADOR</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 56, color: NAVY, margin: 0, letterSpacing: 4, lineHeight: 1 }}>CERTIFICATE</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <div style={{ width: 86, height: 2, background: NAVY }} />
              <span style={{ fontSize: 14, color: ORG, fontWeight: 900, letterSpacing: 4 }}>OF APPOINTMENT</span>
              <div style={{ width: 86, height: 2, background: NAVY }} />
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 10.5, color: '#555', letterSpacing: 1.1 }}>This Certificate is Proudly Awarded To</p>
          </div>

          <div style={{ width: 248, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="Verification QR" width={90} height={90} style={{ borderRadius: 18, border: '1px solid #d9d9d9' }} />
            <div style={{ width: '100%', background: '#f7f9ff', borderRadius: 18, padding: '14px 16px', border: `1px solid ${NAVY}15`, boxShadow: '0 14px 24px rgba(15,30,66,0.06)' }}>
              <div style={{ fontSize: 8, color: ORG, fontWeight: 700, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 9 }}>Scan to verify</div>
              <div style={{ fontSize: 9, color: NAVY, marginBottom: 8 }}><strong>Certificate No.</strong> <span style={{ display: 'inline-block', background: NAVY, color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700 }}>{certNo}</span></div>
              <div style={{ fontSize: 9, color: NAVY, marginBottom: 6 }}><span style={{ fontWeight: 700 }}>Issue Date</span> <span style={{ float: 'right' }}>{issued}</span></div>
              <div style={{ fontSize: 9, color: NAVY }}><span style={{ fontWeight: 700 }}>Valid Until</span> <span style={{ float: 'right' }}>{validUntil}</span></div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 16, marginTop: 18, minHeight: 0 }}>
          <div style={{ width: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 18 }}>
            <OfficialSeal />
            <div style={{ marginTop: 18, fontSize: 10, color: '#444', fontWeight: 700, textAlign: 'center' }}>Official Brand Ambassador Seal</div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
            <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: 46, color: NAVY, margin: '0 0 8px', lineHeight: 1.05 }}>{name}</p>
            <div style={{ width: 360, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, marginBottom: 18 }} />
            <p style={{ fontSize: 14, color: NAVY, textAlign: 'center', margin: '0 0 12px', lineHeight: 1.5 }}>
              For being officially appointed as a <span style={{ fontSize: 18, fontWeight: 900, color: ORG, letterSpacing: 0.8 }}>BRAND AMBASSADOR</span> of E-Nyagasambu Digital Marketplace
            </p>
            <p style={{ fontSize: 10, color: '#555', textAlign: 'center', margin: '0 0 22px', lineHeight: 1.7, maxWidth: 520 }}>
              In recognition of your commitment to promoting digital commerce, supporting local businesses, onboarding users, and representing the values and mission of E-Nyagasambu.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                { icon: 'location' as const, label: 'Authorized Territory', val: territory },
                { icon: 'calendar' as const, label: 'Issue Date', val: issued },
                { icon: 'calendar' as const, label: 'Valid Until', val: validUntil },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ textAlign: 'center', minWidth: 98 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                    <InfoIcon type={icon} />
                    <span style={{ fontSize: 8, color: ORG, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: NAVY, fontWeight: 700 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%', maxWidth: 520 }}>
              <SignatureLine title="Platform Director, E-Nyagasambu Ltd" />
              <div style={{ width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CorporateStamp />
              </div>
              <SignatureLine title="Business Development Officer, E-Nyagasambu Ltd" />
            </div>
          </div>

          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ borderRadius: 20, border: `1.5px solid ${NAVY}`, background: '#eef4fb', overflow: 'hidden', boxShadow: '0 18px 42px rgba(15,30,66,0.06)' }}>
              <div style={{ background: NAVY, padding: '14px 16px', textAlign: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>RESPONSIBILITIES</span>
              </div>
              <div style={{ padding: '16px 14px' }}>
                {RESPONSIBILITIES.map(item => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: ORG, display: 'grid', placeItems: 'center', marginTop: 1 }}>
                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 10, color: NAVY, lineHeight: 1.45 }}>{item}</p>
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
