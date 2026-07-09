'use client';
import { Suspense, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const NAVY   = '#1B2A5E';
const ORG    = '#E85D04';
const MAROON = '#3a1a2e';

function pad(n: number, l: number) { return String(n).padStart(l, '0'); }

/* ── BROKER FRONT CARD ─────────────────────────────────── */
function BrokerFront({ name, brokerId, district, phone, email, qr, photo }: {
  name: string; brokerId: string; district: string; phone: string; email: string; qr: string; photo: string | null;
}) {
  const W = 500, H = 300;
  return (
    <div style={{ width: W, height: H, borderRadius: 12, overflow: 'hidden', position: 'relative', fontFamily: 'Arial,Helvetica,sans-serif', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: NAVY }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polygon points={`295,0 ${W},0 ${W},${H} 185,${H}`} fill={MAROON} />
        <line x1="295" y1="0" x2="185" y2={H} stroke={ORG} strokeWidth="2.5" />
      </svg>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${ORG}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', flexShrink: 0 }}>
                <svg viewBox="0 0 38 38" width="36" height="36">
                  <circle cx="19" cy="19" r="18" fill={NAVY} />
                  <text x="4" y="30" fontSize="26" fontWeight="900" fontFamily="Arial Black,Arial" fill="#fff">E</text>
                  <text x="26" y="32" fontSize="9" fontWeight="700" fontFamily="Arial,sans-serif" fill={ORG}>R</text>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: 1.5, lineHeight: 1.1 }}>E-NYAGASAMBU</div>
                <div style={{ fontSize: 7, color: ORG, letterSpacing: 1.5, fontWeight: 700 }}>DIGITAL MARKET PLACE</div>
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: ORG, letterSpacing: 1, lineHeight: 1 }}>CERTIFIED BROKER</div>
          </div>
          {/* Photo */}
          <div style={{ width: 82, height: 90, borderRadius: 8, overflow: 'hidden', border: `2.5px solid ${ORG}`, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 4 }}>
            {photo
              ? <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg viewBox="0 0 40 45" width="40" height="45" fill="rgba(255,255,255,0.35)"><circle cx="20" cy="14" r="11" /><ellipse cx="20" cy="40" rx="18" ry="12" /></svg>
            }
          </div>
        </div>

        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="16" viewBox="0 0 14 16" fill="rgba(255,255,255,0.6)"><circle cx="7" cy="5" r="4" /><ellipse cx="7" cy="14" rx="7" ry="4" /></svg>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>{name}</span>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 5, columnGap: 8 }}>
          {[
            { icon: '🔒', label: 'Broker ID', val: brokerId },
            { icon: '📍', label: 'District',  val: district },
            { icon: '📞', label: 'Phone',     val: phone || 'N/A' },
            { icon: '✉️', label: 'Email',     val: email.length > 22 ? email.slice(0, 20) + '…' : email },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11 }}>{icon}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>{label} :</span>
              <span style={{ fontSize: 9.5, color: '#fff', fontWeight: 600 }}> {val}</span>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>www.enyagasambu.rw</div>
          <div style={{ textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR" width={58} height={58} style={{ border: '2px solid rgba(255,255,255,0.3)', borderRadius: 4, display: 'block' }} />
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 0.5 }}>SCAN TO VERIFY</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── BROKER BACK CARD ──────────────────────────────────── */
function BrokerBack({ qr }: { qr: string }) {
  return (
    <div style={{ width: 500, height: 300, borderRadius: 12, overflow: 'hidden', background: '#fff', fontFamily: 'Arial,Helvetica,sans-serif', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: NAVY, padding: '10px 20px', textAlign: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: 2.5 }}>AUTHORIZED SERVICES</span>
      </div>
      <div style={{ flex: 1, display: 'flex', padding: '14px 20px 0' }}>
        <div style={{ flex: 1 }}>
          {['Product Brokerage', 'Property Brokerage', 'Vehicle Brokerage', 'Marketplace Verification', 'Customer Support'].map(s => (
            <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: ORG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>
              </div>
              <span style={{ fontSize: 12.5, color: '#222' }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ width: 1, background: '#e5e7eb', margin: '0 16px' }} />
        <div style={{ width: 170 }}>
          {[
            { icon: '🌐', label: 'Website',   val: 'www.enyagasambu.rw' },
            { icon: '✉️', label: 'Email',     val: 'info@enyagasambu.rw' },
            { icon: '📞', label: 'Emergency', val: '0788 300 003' },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 8.5, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}><span>{icon}</span><span>{label}</span></div>
              <div style={{ fontSize: 10.5, color: NAVY, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR" width={56} height={56} style={{ border: '1px solid #ddd', borderRadius: 4, display: 'block', margin: '0 auto' }} />
            <div style={{ fontSize: 7, color: '#bbb', marginTop: 2, letterSpacing: 0.5 }}>SCAN TO VERIFY</div>
          </div>
        </div>
      </div>
      <div style={{ background: ORG, padding: '8px 20px', textAlign: 'center' }}>
        <em style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Building Trust. Connecting Opportunities. Growing Together.</em>
      </div>
    </div>
  );
}

/* ── PHOTO UPLOAD ──────────────────────────────────────── */
function PhotoUploadStep({ onPhoto, onSkip }: { onPhoto: (url: string) => void; onSkip: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span className="text-white text-2xl">📷</span>
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Upload Profile Photo</h2>
        <p className="text-sm text-gray-500 mb-6">Your photo will appear on your Certified Broker ID card.</p>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="cursor-pointer rounded-2xl border-2 border-dashed mb-6 overflow-hidden transition"
          style={{ borderColor: dragging ? ORG : '#d1d5db', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: dragging ? '#fff7f2' : '#f9fafb' }}
        >
          {preview
            ? <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <><span className="text-5xl mb-3">🖼️</span><p className="text-sm text-gray-400">Click or drag &amp; drop your photo here</p><p className="text-xs text-gray-300 mt-1">JPG, PNG, WEBP supported</p></>
          }
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <div className="flex gap-3 justify-center">
          {preview && (
            <button onClick={() => onPhoto(preview)} className="text-white font-bold px-6 py-2.5 rounded-lg transition hover:opacity-90 text-sm" style={{ background: ORG }}>
              Use This Photo →
            </button>
          )}
          <button onClick={onSkip} className="font-medium px-6 py-2.5 rounded-lg border transition hover:bg-gray-50 text-sm" style={{ color: NAVY, borderColor: '#d1d5db' }}>
            {preview ? 'Skip Photo' : 'Skip for now'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ─────────────────────────────────────────── */
function CertContent() {
  const { user, loading } = useAuth();
  const params = useSearchParams();

  const [photo, setPhoto]         = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('broker_photo');
    return null;
  });
  const [photoStep, setPhotoStep] = useState(!photo);

  /* If someone hits /certificate?type=ambassador redirect them to dashboard */
  const type = params.get('type');
  if (type === 'ambassador') {
    if (typeof window !== 'undefined') window.location.replace('/dashboard');
    return null;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-lg text-gray-600">Please sign in to view your ID card.</p>
      <Link href="/login" className="text-white px-6 py-2.5 rounded-lg font-bold text-sm" style={{ background: ORG }}>Sign In</Link>
    </div>
  );

  const isStaff = user.role === 'admin' || user.role === 'staff';
  const year    = new Date().getFullYear();
  const certNo  = `ENB-${year}-${pad(user.id, 3)}`;
  const verifyUrl = `https://enyagasambu.rw/verify/${certNo}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=1B2A5E&margin=4`;

  /* Photo upload step */
  if (photoStep) {
    return (
      <div style={{ background: '#e8ebf4', minHeight: '100vh' }}>
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: NAVY }}>E</div>
            <span className="font-semibold text-sm" style={{ color: NAVY }}>Broker ID Card — Photo Upload</span>
          </div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">← Dashboard</Link>
        </div>
        <PhotoUploadStep onPhoto={url => { setPhoto(url); setPhotoStep(false); localStorage.setItem('broker_photo', url); }} onSkip={() => { setPhotoStep(false); localStorage.removeItem('broker_photo'); }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: #fff !important; }
          @page { size: A4 landscape; margin: 4mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          #cert-print-area { display: flex !important; flex-direction: row !important; gap: 12px !important; justify-content: center !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="no-print sticky top-0 z-50 flex flex-wrap gap-3 justify-center items-center py-3 px-4 border-b bg-gray-50 shadow-sm">
        <span className="text-sm font-semibold" style={{ color: NAVY }}>{user.name}</span>
        <span className="text-xs px-2.5 py-0.5 rounded-full text-white font-bold" style={{ background: NAVY }}>Certified Broker</span>

        {/* Print — staff/admin only */}
        {isStaff ? (
          <button onClick={() => window.print()}
            className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2 rounded-lg transition hover:opacity-90"
            style={{ background: NAVY }}>
            🖨️ Print ID Card
          </button>
        ) : (
          <span className="text-xs px-4 py-2 rounded-lg border font-medium" style={{ color: '#6b7280', borderColor: '#e5e7eb', background: '#f9fafb' }}>
            🔒 Printing available through the Staff Portal
          </span>
        )}

        <button onClick={() => { setPhoto(null); setPhotoStep(true); }}
          className="text-sm font-medium px-4 py-2 rounded-lg border transition hover:bg-gray-100"
          style={{ color: NAVY, borderColor: NAVY }}>
          📷 Change Photo
        </button>
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">← Dashboard</Link>
      </div>

      {/* Cards */}
      <div style={{ background: '#e8ebf4', minHeight: 'calc(100vh - 56px)', padding: '28px 16px 48px' }}>
        <div className="no-print text-center mb-3">
          <p className="text-xs font-semibold text-gray-400">
            {isStaff ? 'Staff view — print enabled' : 'Preview only — a staff member will print your ID card'}
          </p>
        </div>
        <div id="cert-print-area" style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div>
            <p className="no-print text-xs font-bold text-gray-400 text-center mb-2 tracking-widest uppercase">Front Side</p>
            <BrokerFront name={user.name} brokerId={certNo} district="Kigali City" phone={user.phone || '+250 000 000 000'} email={user.email} qr={qr} photo={photo} />
          </div>
          <div>
            <p className="no-print text-xs font-bold text-gray-400 text-center mb-2 tracking-widest uppercase">Back Side</p>
            <BrokerBack qr={qr} />
          </div>
        </div>
      </div>
    </>
  );
}

export default function CertificatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-300">Loading…</div>}>
      <CertContent />
    </Suspense>
  );
}
