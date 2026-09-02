'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import api from '@/lib/api';
import { Lock, Camera, Image, BadgeCheck, CheckCircle, Clock, Coins } from '@/lib/icons';
import { useQrDataUrl } from '@/components/QrCode';
import { SITE_DOMAIN } from '@/lib/config';
import BrokerCertificate from '@/components/BrokerCertificate';

const NAVY = '#0e1f4b';
const ORG = '#f2701c';

function pad(n: number, l: number) { return String(n).padStart(l, '0'); }


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
            : <><Image size={40} className="mb-3" aria-hidden="true" /><p className="text-sm text-gray-400">Click or drag &amp; drop your photo here</p><p className="text-xs text-gray-300 mt-1">JPG, PNG, WEBP supported</p></>
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
  const { format } = useCurrency();
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
                <p className="text-lg font-extrabold" style={{ color: NAVY }}>{format(t.price_rwf)}</p>
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
  const { format } = useCurrency();
  const { user, loading } = useAuth();
  const [photo, setPhoto] = useState<string[]>([]); // Array of photo URLs, first is main
  const [photoStep, setPhotoStep] = useState(true);
  const [certStatus, setCertStatus] = useState<string | null>(null);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [types, setTypes] = useState<CertType[]>([]);
  const [selectedType, setSelectedType] = useState<CertType | null>(null);
  const [msg, setMsg] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [brokerData, setBrokerData] = useState<{ district?: string; location?: string; } | null>(null);

  const qrYear = new Date().getFullYear();
  const qrCertNo = cert?.cert_no || (user ? `ENA-BRK-${qrYear}-${pad(user.id, 4)}` : '');
  const verifyUrl = qrCertNo ? `https://${SITE_DOMAIN}/verify-broker/${qrCertNo}` : '';
  useQrDataUrl(verifyUrl, { size: 130, color: '#1B2A5E', bgColor: '#ffffff', margin: 4 });

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

  const fetchBrokerData = useCallback(() => {
    api.get('/auth/broker/me')
      .then(({ data }) => {
        setBrokerData(data.user || data || {});
      })
      .catch(() => {
        setBrokerData({});
      });
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
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setPhoto(parsed);
          else if (typeof parsed === 'string' && parsed.startsWith('data:')) setPhoto([parsed]);
          else if (saved.startsWith('data:')) setPhoto([saved]);
        } catch {
          if (saved.startsWith('data:')) setPhoto([saved]);
        }
        setPhotoStep(false);
      });
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  useEffect(() => {
    if (user && !photoStep) {
      fetchStatus();
      fetchBrokerData();
    }
  }, [user, photoStep, fetchStatus, fetchBrokerData]);

  const handleSetPhoto = async (url: string) => {
    let next: string[] = [];
    setPhoto(prev => {
      if (prev.includes(url)) { next = prev; return prev; }
      next = [url, ...prev];
      localStorage.setItem('broker_photo', JSON.stringify(next));
      return next;
    });
    setPhotoStep(false);
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
      const { data } = await api.post('/broker/certificate/pay', { phone, certificateTypeId: selectedType?.id });
      setMsg('Payment request sent. Approve on your phone.');
      
      // Poll for payment status
      const pollInterval = setInterval(async () => {
        try {
          const { data: statusData } = await api.get(`/broker/certificate/payment-status/${data.referenceId}`);
          if (statusData.status === 'generated' || statusData.status === 'paid') {
            clearInterval(pollInterval);
            if (statusData.status === 'generated') {
              setMsg('Certificate is ready!');
            } else {
              setMsg('Payment successful! Waiting for admin to generate your certificate.');
            }
            fetchStatus();
            setBusy(false);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            setMsg('Payment failed. Try again.');
            setBusy(false);
          }
        } catch {
          clearInterval(pollInterval);
          setBusy(false);
        }
      }, 5000);
      
      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : 'Payment initiation failed');
      setMsg(msg);
      setBusy(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  const year = new Date().getFullYear();
  const certNo = cert?.cert_no || `ENA-BRK-${year}-${pad(user.id, 4)}`;

  const price = cert?.amount_rwf ?? cert?.type_price ?? selectedType?.price_rwf ?? 2000;

  if (photoStep) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <img src="/assets/logo.png" alt="E-Nyagasambu" className="w-8 h-8 object-contain" />
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
            <p className="text-xs font-bold text-gray-400 mb-2 tracking-widest uppercase">Certificate Preview</p>
            <BrokerCertificate
              name={user.name}
              brokerId={certNo}
              district={brokerData?.district || brokerData?.location || 'Kigali City'}
              phone={user.phone || '+250 000 000 000'}
              email={user.email}
              photo={photo[0] || null}
              services={user.services || []}
              showBack={true}
            />
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
                    <p className="text-sm font-extrabold mt-2" style={{ color: NAVY }}>{format(selectedType.price_rwf)}</p>
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
                    {busy ? 'Processing...' : `Request & Pay ${format(selectedType.price_rwf)} →`}
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
                    <p className="text-sm font-semibold text-gray-700">Pay {format(price)} to proceed</p>
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
