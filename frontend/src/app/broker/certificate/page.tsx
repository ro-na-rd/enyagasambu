'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Lock, MapPin, Phone, Mail, Globe, Camera, Image, User, BadgeCheck, CheckCircle, Clock, Coins } from '@/lib/icons';
import { SITE_DOMAIN } from '@/lib/config';

const NAVY = '#0e1f4b';
const NAVY_2 = '#132a63';
const ORG = '#f2701c';

function pad(n: number, l: number) { return String(n).padStart(l, '0'); }

const formatName = (fullName: string) => {
  const parts = (fullName || '').trim().split(/\s+/);
  const first = parts[0]?.toUpperCase() || '';
  const rest = parts.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return rest ? `${first} ${rest}` : first;
};

const fmtRWF = (n: number) => 'RWF ' + Number(n || 0).toLocaleString('en-US');

interface CertType {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  price_rwf: number;
  duration_years: number;
}

interface Certificate {
  id?: number;
  cert_no?: string;
  status?: string;
  issued_date?: string;
  valid_until?: string;
  amount_rwf?: number;
  type_name?: string;
  type_price?: number;
  type_duration?: number;
}

/* ── BROKER FRONT CARD ─────────────────────────────────── */
function BrokerFront({ name, brokerId, district, phone, email, qr, photo }: {
  name: string; brokerId: string; district: string; phone: string; email: string; qr: string; photo: string | null;
}) {
  const W = 520, H = 300;
  return (
    <div style={{ width: W, height: H, borderRadius: 22, overflow: 'hidden', position: 'relative', background: '#fff', fontFamily: "'Poppins', Arial, sans-serif", boxShadow: '0 22px 45px rgba(10,20,50,0.25)', flexShrink: 0 }}>
      {/* Navy panel */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '64%', background: `linear-gradient(160deg, ${NAVY_2}, ${NAVY} 70%)`, clipPath: 'polygon(0 0,100% 0,78% 100%,0 100%)', padding: '26px 30px', color: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', position: 'relative', flexShrink: 0 }}>
            <img src="/logo.jpg" alt="E-Nyagasambu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>E-NYAGASAMBU</div>
            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1.5, color: '#cfd6ec' }}>DIGITAL MARKET PLACE</div>
          </div>
        </div>

        <div style={{ color: ORG, fontWeight: 800, fontSize: 13, letterSpacing: 2, marginTop: 6 }}>CERTIFIED BROKER</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 19, marginTop: 8 }}>
          <User size={15} color={ORG} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{formatName(name)}</span>
        </div>

        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { ic: <BadgeCheck size={11} color={ORG} />, k: 'Broker ID', v: brokerId },
            { ic: <MapPin size={11} color={ORG} />, k: 'District',  v: district },
            { ic: <Phone size={11} color={ORG} />, k: 'Phone',     v: phone || 'N/A' },
            { ic: <Mail size={11} color={ORG} />, k: 'Email',     v: email.length > 22 ? email.slice(0, 20) + '\u2026' : email },
          ].map(({ ic, k, v }) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 11.5 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORG, flexShrink: 0 }}>{ic}</span>
              <span style={{ color: '#c6cde6', minWidth: 52 }}>{k}</span>
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>: {v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Orange slice */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '20%', background: ORG, clipPath: 'polygon(35% 0,100% 0,100% 100%,0 100%)', opacity: 0.95 }} />

      {/* Photo */}
      <div style={{ position: 'absolute', top: 26, right: 74, width: 96, height: 96, borderRadius: '50%', border: `3px solid ${ORG}`, overflow: 'hidden', background: '#dfe3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
        {photo
          ? <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <User size={54} color="#98a1bd" />
        }
      </div>

      {/* QR */}
      <div style={{ position: 'absolute', bottom: 20, right: 26, zIndex: 3, textAlign: 'center' }}>
        <img src={qr} alt="QR" width={78} height={78} style={{ border: `4px solid ${ORG}`, borderRadius: 6, display: 'block' }} />
        <div style={{ fontSize: 8, fontWeight: 700, color: NAVY, letterSpacing: 0.5, marginTop: 2 }}>SCAN TO VERIFY</div>
      </div>
    </div>
  );
}

/* ── BROKER BACK CARD ──────────────────────────────────── */
function BrokerBack({ qr }: { qr: string }) {
  return (
    <div style={{ width: 520, height: 300, borderRadius: 22, overflow: 'hidden', background: '#fff', border: '1px solid #eee', fontFamily: "'Poppins', Arial, sans-serif", boxShadow: '0 22px 45px rgba(10,20,50,0.25)', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '26px 30px 0' }}>
      <div style={{ alignSelf: 'flex-start', background: NAVY, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: '7px 16px', borderRadius: 8, marginBottom: 16 }}>AUTHORIZED SERVICES</div>

      <div style={{ display: 'flex', flex: 1, gap: 20 }}>
        <div style={{ flex: 1.15, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Product Brokerage', 'Property Brokerage', 'Vehicle Brokerage', 'Marketplace Verification', 'Customer Support'].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, color: NAVY, fontWeight: 600 }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: ORG, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0 }}>{'\u2713'}</span>
              {s}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 16, borderLeft: '1px solid #eee' }}>
          {[
            { ic: <Globe size={15} color={NAVY} />, label: 'Website',   val: `www.${SITE_DOMAIN}` },
            { ic: <Mail size={15} color={NAVY} />, label: 'Email',     val: `info@${SITE_DOMAIN}` },
            { ic: <Phone size={15} color={NAVY} />, label: 'Emergency Contact', val: '+250 788 300 003' },
          ].map(({ ic, label, val }) => (
            <div key={label} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <span style={{ color: NAVY, marginTop: 1, flexShrink: 0 }}>{ic}</span>
              <div>
                <div style={{ fontSize: 10, color: '#5c6684', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 11.5, color: NAVY, fontWeight: 700 }}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <img src={qr} alt="QR" width={72} height={72} style={{ border: `3px solid ${NAVY}`, borderRadius: 6, display: 'block' }} />
          <div style={{ fontSize: 8, fontWeight: 700, color: NAVY, letterSpacing: 0.5 }}>SCAN TO VERIFY</div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', background: NAVY, color: ORG, textAlign: 'center', fontWeight: 700, fontSize: 11.5, letterSpacing: 0.4, padding: '11px 10px', position: 'relative', overflow: 'hidden' }}>
        Building Trust. Connecting Opportunities. Growing Together.
        <span style={{ position: 'absolute', right: -10, bottom: -10, width: 70, height: 70, background: ORG, opacity: 0.25, clipPath: 'polygon(40% 100%,100% 40%,100% 100%)' }} />
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
          <Camera size={24} className="text-white" />
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
            : <><Image size={40} className="mb-3" /><p className="text-sm text-gray-400">Click or drag &amp; drop your photo here</p><p className="text-xs text-gray-300 mt-1">JPG, PNG, WEBP supported</p></>
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

/* ── CATALOG STEP ──────────────────────────────────────── */
function CatalogStep({ types, onSelect }: { types: CertType[]; onSelect: (t: CertType) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BadgeCheck size={18} style={{ color: ORG }} />
        <p className="text-sm font-bold text-gray-800">Choose your certificate</p>
      </div>
      <div className="space-y-3">
        {types.length === 0 && <p className="text-sm text-gray-500">No certificates are currently available.</p>}
        {types.map(t => (
          <button key={t.id} onClick={() => onSelect(t)}
            className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-[#E85D04] hover:shadow-md transition group">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-[#E85D04] transition">{t.name}</p>
                <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                  <Clock size={11} /> Valid {t.duration_years} year{t.duration_years > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-extrabold" style={{ color: NAVY }}>{fmtRWF(t.price_rwf)}</p>
                <span className="text-[11px] font-bold text-white px-3 py-1.5 rounded-lg inline-block" style={{ background: ORG }}>
                  Get Certified →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── PROGRESS STEPS ────────────────────────────────────── */
function ProgressSteps({ current }: { current: 'request' | 'pay' | 'issued' }) {
  const steps = [
    { key: 'request', label: 'Request' },
    { key: 'pay', label: 'Payment' },
    { key: 'issued', label: 'Issued' },
  ];
  const order = { request: 0, pay: 1, issued: 2 };
  const cur = order[current];
  return (
    <div className="flex items-center gap-2 mb-5">
      {steps.map((s, i) => {
        const done = i <= cur;
        const isCurrent = i === cur;
        return (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${done ? 'text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                style={done ? { background: i === cur ? ORG : NAVY } : {}}>
                {done ? (isCurrent ? <Clock size={13} /> : <CheckCircle size={13} />) : i + 1}
              </div>
              <span className={`text-xs font-semibold ${done ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < cur ? 'bg-[#E85D04]' : 'bg-gray-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Payment Pending', color: '#b45309', bg: '#fffbeb' },
  paid:      { label: 'Paid – Awaiting Generation', color: '#1d4ed8', bg: '#eff6ff' },
  generated: { label: 'Certificate Issued', color: '#15803d', bg: '#f0fdf4' },
};

export default function BrokerCertificatePage() {
  const { user, loading } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoStep, setPhotoStep] = useState(true);
  const [certStatus, setCertStatus] = useState<string | null>(null);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [types, setTypes] = useState<CertType[]>([]);
  const [selectedType, setSelectedType] = useState<CertType | null>(null);
  const [msg, setMsg] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const uploadPhotoToBackend = async (dataUrl: string) => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append('photo', blob, 'profile.jpg');
      await api.post('/broker/certificate/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch { }
  };

  const fetchStatus = useCallback(() => {
    api.get('/broker/certificate')
      .then(({ data }) => {
        const c = data.certificate;
        setCert(c);
        setCertStatus(c?.status || null);
        if (c && (c.status === 'pending' || c.status === 'paid' || c.status === 'generated')) {
          setSelectedType(null);
        }
      })
      .catch(() => { });
  }, []);

  const fetchTypes = useCallback(() => {
    api.get('/certificate-types')
      .then(({ data }) => {
        const brokerTypes = (data.types || []).filter((t: CertType) => t.category === 'broker' || !t.category);
        setTypes(brokerTypes);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('broker_photo');
    if (saved) {
      Promise.resolve().then(() => {
        setPhoto(saved);
        setPhotoStep(false);
      });
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  useEffect(() => {
    if (user && !photoStep) fetchStatus();
  }, [user, photoStep, fetchStatus]);

  const handleSetPhoto = async (url: string) => {
    setPhoto(url);
    setPhotoStep(false);
    localStorage.setItem('broker_photo', url);
    setUploadingPhoto(true);
    await uploadPhotoToBackend(url);
    setUploadingPhoto(false);
    fetchStatus();
  };

  const handleSelectType = (t: CertType) => {
    setSelectedType(t);
    setMsg('');
  };

  const handleRequest = async () => {
    if (!selectedType) { setMsg('Choose a certificate type first'); return; }
    setBusy(true); setMsg('');
    try {
      const { data } = await api.post('/broker/certificate/request', { certificateTypeId: selectedType.id });
      setMsg(data.message);
      fetchStatus();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : 'Failed to request certificate');
      setMsg(msg);
    } finally { setBusy(false); }
  };

  const handlePay = async () => {
    if (!phone) { setMsg('Enter your phone number'); return; }
    setBusy(true); setMsg('');
    try {
      const { data } = await api.post('/broker/certificate/pay', { phone });
      setMsg(data.message);
      fetchStatus();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : 'Payment submission failed');
      setMsg(msg);
    } finally { setBusy(false); }
  };

  if (loading) return null;
  if (!user) return null;

  const year = new Date().getFullYear();
  const certNo = cert?.cert_no || `ENB-${year}-${pad(user.id, 3)}`;
  const verifyUrl = `https://${SITE_DOMAIN}/verify/${certNo}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=1B2A5E&margin=4`;

  const price = cert?.amount_rwf ?? cert?.type_price ?? selectedType?.price_rwf ?? 2000;

  if (photoStep) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: '#fff' }}>
            <img src="/logo.jpg" alt="E-Nyagasambu" className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold text-sm" style={{ color: NAVY }}>Broker ID Card — Photo Upload</span>
        </div>
        <PhotoUploadStep
          onPhoto={handleSetPhoto}
          onSkip={() => { setPhotoStep(false); }}
        />
      </div>
    );
  }

  const st = certStatus ? statusMeta[certStatus] : null;
  const showCatalog = !certStatus && !selectedType;
  const currentStep: 'request' | 'pay' | 'issued' = certStatus === 'generated' ? 'issued' : certStatus === 'paid' ? 'pay' : certStatus === 'pending' ? 'pay' : 'request';

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Broker Certificate</h1>
          <p className="text-sm text-gray-500 mt-1">Your official E-Nyagasambu Certified Broker ID card</p>
        </div>
      </div>

      {msg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3 mb-4">{msg}</div>
      )}

      <ProgressSteps current={currentStep} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Certificate Cards */}
        <div className="flex-shrink-0 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 mb-2 tracking-widest uppercase">Front Side</p>
            <BrokerFront
              name={user.name}
              brokerId={certNo}
              district="Kigali City"
              phone={user.phone || '+250 000 000 000'}
              email={user.email}
              qr={qr}
              photo={photo}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 mb-2 tracking-widest uppercase">Back Side</p>
            <BrokerBack qr={qr} />
          </div>
          <button
            onClick={() => { setPhotoStep(true); }}
            className="text-sm font-medium px-4 py-2 rounded-lg border transition hover:bg-gray-50"
            style={{ color: NAVY, borderColor: NAVY }}
          >
            <Camera size={16} className="inline mr-1 align-middle" /> Change Photo
          </button>
          {uploadingPhoto && <span className="text-xs text-gray-400">Uploading photo...</span>}
        </div>

        {/* Status / Catalog Panel */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-gray-900">
              {cert?.type_name ? `${cert.type_name} Certificate` : 'Certificate Status'}
            </h3>

            {showCatalog ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
                  You haven&apos;t requested a certificate yet. Choose a paid certificate below to get your official ID.
                </div>
                <CatalogStep types={types} onSelect={handleSelectType} />
              </div>
            ) : selectedType && !certStatus ? (
              /* Type selected but not yet requested */
              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#fff7ed' }}>
                    <Coins size={18} style={{ color: ORG }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedType.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedType.description}</p>
                    <p className="text-sm font-extrabold mt-2" style={{ color: NAVY }}>{fmtRWF(selectedType.price_rwf)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedType(null)}
                    className="text-sm font-medium px-4 py-2.5 rounded-lg border transition hover:bg-gray-50"
                    style={{ color: NAVY, borderColor: '#d1d5db' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRequest}
                    disabled={busy}
                    className="text-white font-bold px-6 py-2.5 rounded-lg transition hover:opacity-90 text-sm flex-1"
                    style={{ background: ORG }}
                  >
                    {busy ? 'Processing...' : `Request & Pay ${fmtRWF(selectedType.price_rwf)} →`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${st?.bg}`} style={{ color: st?.color }}>
                    {st?.label}
                  </span>
                  {cert?.cert_no && (
                    <span className="text-xs font-mono text-gray-500">#{cert.cert_no}</span>
                  )}
                </div>

                {/* Pending: show payment instructions */}
                {certStatus === 'pending' && (
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    <p className="text-sm font-semibold text-gray-700">Pay {fmtRWF(price)} to proceed</p>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Your phone number (MTN / Airtel)</label>
                      <div className="flex gap-2">
                        <input
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="e.g. 0788123456"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          onClick={handlePay}
                          disabled={busy}
                          className="text-white font-bold px-5 py-2 rounded-lg text-sm transition hover:opacity-90"
                          style={{ background: NAVY }}
                        >
                          {busy ? '...' : 'Submit'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Admin will confirm your payment and generate the certificate.
                      </p>
                    </div>
                  </div>
                )}

                {/* Paid: waiting for admin */}
                {certStatus === 'paid' && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm">
                    Payment confirmed. An admin will generate your certificate shortly.
                  </div>
                )}

                {/* Generated: show details */}
                {certStatus === 'generated' && cert && (
                  <div className="space-y-3 border-t border-gray-100 pt-4 text-sm">
                    <div><span className="text-gray-400">Certificate No:</span> <span className="font-semibold font-mono">{cert.cert_no}</span></div>
                    <div><span className="text-gray-400">Issued:</span> {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('en-GB') : '-'}</div>
                    <div><span className="text-gray-400">Valid Until:</span> {cert.valid_until ? new Date(cert.valid_until).toLocaleDateString('en-GB') : '-'}</div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
                      <Lock size={14} className="inline mr-1 align-middle" /> Printing is available through the Admin Portal. Please contact an admin to print your certificate.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
