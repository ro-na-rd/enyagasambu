'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Check, Lock, Download, Camera } from '@/lib/icons';
import AmbassadorCertificate from '@/components/AmbassadorCertificate';

const NAVY = '#0f1e42';
const ORG = '#E85D04';
const DEFAULT_PRICE = 2000;

const fmtRWF = (n: number) => 'RWF ' + Number(n || 0).toLocaleString('en-US');


function CertWatermark({ price }: { price: number }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 pointer-events-none"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}>
      <div className="text-center rotate-[-25deg] opacity-60 select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <p key={i} className="text-lg font-black tracking-[0.3em] text-gray-300" style={{ lineHeight: 2.2 }}>PREVIEW</p>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-5 text-center shadow-2xl pointer-events-auto select-none"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
          <Lock size={36} className="mx-auto mb-2 text-white/80" />
          <p className="text-white font-extrabold text-lg">Preview Only</p>
          <p className="text-white/60 text-sm mt-1">Pay {fmtRWF(price)} to unlock & download</p>
        </div>
      </div>
    </div>
  );
}

export default function AmbassadorCertificatePage() {
  const { user } = useAuth();
  const [cert, setCert] = useState<{
    cert_no?: string; status?: string; issued_date?: string; valid_until?: string;
    ambassador_name?: string; ambassador_photo?: string | null; photo_url?: string | null;
    certificate_type_id?: number | null; type_price?: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchCert = async () => {
    api.get('/ambassador/certificate')
      .then(({ data }) => setCert(data.certificate))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCert(); }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      await api.post('/ambassador/certificate/upload-photo', formData);
      setMsg('Photo uploaded successfully!');
      await fetchCert();
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handlePay = async () => {
    if (!phone) return setMsg('Enter your MoMo phone number');
    setPaying(true);
    setMsg('');
    try {
      const { data } = await api.post('/ambassador/certificate/pay', { phone, certificateTypeId: cert?.certificate_type_id });
      setMsg('Payment request sent. Approve on your phone.');
      pollRef.current = setInterval(async () => {
        try {
          const { data: statusData } = await api.get(`/ambassador/certificate/payment-status/${data.referenceId}`);
          if (statusData.status === 'generated' || statusData.status === 'paid') {
            if (pollRef.current) clearInterval(pollRef.current);
            if (statusData.status === 'generated') setMsg('Certificate is ready!');
            else setMsg('Payment successful! Waiting for admin to generate your certificate.');
            await fetchCert();
            setPaying(false);
          } else if (statusData.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setMsg('Payment failed. Try again.');
            setPaying(false);
          }
        } catch { if (pollRef.current) clearInterval(pollRef.current); setPaying(false); }
      }, 5000);
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : 'Payment initiation failed'));
      setPaying(false);
    }
  };

  const certYear = new Date().getFullYear();
  const issuedDisplay = cert?.issued_date
    ? new Date(cert.issued_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const validUntilDisplay = cert?.valid_until
    ? new Date(cert.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date(certYear + 1, new Date().getMonth(), new Date().getDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const ambassadorName = cert?.ambassador_name || user?.name || 'Your Name';
  const ambassadorPhoto = cert?.ambassador_photo || cert?.photo_url || null;
  const certPrice = cert?.type_price ?? DEFAULT_PRICE;

  if (loading) return (
    <div className="p-8 text-center"><p className="text-gray-400 animate-pulse">Loading...</p></div>
  );

  const status = cert?.status || 'pending';
  const isGenerated = status === 'generated';
  const hasPhoto = !!ambassadorPhoto;

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #ambassador-cert-print, #ambassador-cert-print * { visibility: visible !important; }
          #ambassador-cert-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            max-width: none !important;
            aspect-ratio: auto !important;
            height: 100vh !important;
            box-shadow: none !important;
            margin: 0 !important;
            page-break-inside: avoid;
          }
          @page { size: landscape; margin: 0; }
        }
      `}</style>

      <div className="p-4 lg:p-8 max-w-5xl mx-auto" onContextMenu={e => { if (!isGenerated) e.preventDefault(); }}>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Certificate</h1>
        <p className="text-sm text-gray-500 mb-6">
          {isGenerated
            ? 'Your official ambassador certificate is ready.'
            : `Upload your photo, then pay ${fmtRWF(certPrice)} to unlock and download your official ambassador certificate.`}
        </p>

        {msg && (
          <div className={`text-sm rounded-lg px-4 py-3 mb-6 border ${
            msg.includes('failed') || msg.includes('Failed')
              ? 'bg-red-50 border-red-200 text-red-800'
              : msg.includes('ready')
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>{msg}</div>
        )}

        <div className="relative mb-6 overflow-x-auto">
          <AmbassadorCertificate
            name={ambassadorName}
            certNo={cert?.cert_no || `ENA-AMB-${certYear}-0001`}
            issued={issuedDisplay}
            validUntil={validUntilDisplay}
          />
          {!isGenerated && <CertWatermark price={certPrice} />}
        </div>

        {!isGenerated && status !== 'paid' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">
              {hasPhoto ? 'Update Your Photo' : 'Upload Your Photo'}
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              {hasPhoto
                ? 'You already have a photo. You can replace it or proceed to payment.'
                : 'Upload a passport-style photo for your ambassador profile.'}
            </p>
            <div className="flex items-center gap-3">
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload}
                className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-sm px-5 py-2.5 rounded-lg text-white font-bold transition disabled:opacity-50 flex items-center gap-2"
                style={{ background: NAVY }}>
                {uploading ? 'Uploading...' : <><Camera size={16} /> {hasPhoto ? 'Change Photo' : 'Choose Photo'}</>}
              </button>
              {hasPhoto && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check size={14} /> Photo added
                </span>
              )}
            </div>
          </div>
        )}

        {!isGenerated && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">
              {status === 'paid' ? 'Payment Received' : 'Unlock Your Certificate'}
            </h2>
            {status === 'paid' ? (
              <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
                Payment received! Waiting for admin to generate your certificate.
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">Pay via MTN MoMo to unlock and download your certificate.</p>
                <div className="flex items-center gap-3">
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="078xxxxxxx" className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20" />
                  <button onClick={handlePay} disabled={paying}
                    className="text-sm px-6 py-2.5 rounded-lg text-white font-bold transition disabled:opacity-50 flex items-center gap-2"
                    style={{ background: ORG }}>
                    {paying ? 'Processing...' : <><Lock size={14} /> Pay {fmtRWF(certPrice)}</>}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {isGenerated && (
          <div className="text-center">
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-lg text-white transition hover:opacity-90"
              style={{ background: ORG }}>
              <Download size={16} /> Download Certificate
            </button>
            <p className="text-xs text-gray-400 mt-2">Print or save as PDF</p>
          </div>
        )}
      </div>
    </>
  );
}
