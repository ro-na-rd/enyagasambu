'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Check, Lock, Download, Camera } from '@/lib/icons';
import { SITE_URL } from '@/lib/config';
import { useQrDataUrl } from '@/components/QrCode';

const NAVY = '#0f1e42';
const ORG = '#E85D04';
const DEFAULT_PRICE = 2000;

const fmtRWF = (n: number) => 'RWF ' + Number(n || 0).toLocaleString('en-US');

function CertPreview({ name, businessName, photo, certNo, issued, validUntil }: { name: string; businessName?: string | null; photo?: string | null; certNo?: string; issued: string; validUntil: string }) {
  const verifyUrl = `${SITE_URL}/verify-supplier/${certNo || 'pending'}`;
  const qrUrl = useQrDataUrl(verifyUrl, { size: 100, color: NAVY, bgColor: '#ffffff' });

  return (
    <div id="supplier-cert-print" className="relative bg-white rounded-xl overflow-hidden border border-gray-200 select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}>
      {['tl','tr','bl','br'].map(p => {
        const W=90,H=90; const pts:Record<string,string>={tl:`0,0 ${W},0 0,${H}`,tr:`${W},0 ${W},${H} 0,0`,bl:`0,0 0,${H} ${W},${H}`,br:`${W},0 0,${H} ${W},${H}`};
        const css:Record<string,React.CSSProperties>={tl:{top:0,left:0},tr:{top:0,right:0},bl:{bottom:0,left:0},br:{bottom:0,right:0}};
        return (
          <svg key={p} width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position:'absolute',zIndex:1,pointerEvents:'none',...css[p]}}>
            <polygon points={pts[p]} fill={NAVY}/>
            {[[W/2-20,12],[W/2,18],[W/2+10,30],[18,H/2-5],[28,H/2+8],[40,H/2-2]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="2.5" fill="rgba(255,255,255,0.35)"/>)}
          </svg>
        );
      })}
      <div className="absolute top-4 bottom-4 left-5 w-0.5 opacity-30" style={{background:`linear-gradient(180deg,${ORG},transparent 40%,transparent 60%,${ORG})`}}/>
      <div className="absolute top-4 bottom-4 right-5 w-0.5 opacity-30" style={{background:`linear-gradient(180deg,${ORG},transparent 40%,transparent 60%,${ORG})`}}/>
      <div className="relative z-10 p-8">
        <div className="flex items-center gap-4 mb-6">
          <img src="/assets/logo.png" alt="E-Nyagasambu" className="w-14 h-14 object-contain" />
          <div>
            <p className="font-extrabold text-lg leading-tight" style={{color:NAVY}}>E-NYAGASAMBU</p>
            <p className="font-bold tracking-widest" style={{fontSize:10,color:ORG}}>DIGITAL MARKET PLACE</p>
          </div>
        </div>
        <div className="text-center mb-6">
          {photo && (
            <div className="mb-4 flex justify-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-lg" style={{borderColor:ORG}}>
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Certificate of Verification</p>
          <p className="text-4xl font-extrabold" style={{color:NAVY}}>{name}</p>
          {businessName && (
            <p className="text-base font-bold mt-1" style={{color:ORG}}>{businessName}</p>
          )}
          <div className="w-32 h-0.5 mx-auto my-4" style={{background:`linear-gradient(90deg,transparent,${ORG},transparent)`}}/>
          <p className="text-2xl font-black tracking-wide" style={{color:ORG}}>VERIFIED SUPPLIER</p>
          <p className="text-sm text-gray-500 mt-1">on E-Nyagasambu Digital Marketplace</p>
        </div>
        <div className="border-t border-dashed border-gray-200 pt-4 grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <p className="text-gray-400 mb-0.5">Certificate No.</p>
            <p className="font-bold" style={{color:NAVY}}>{certNo || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Issue Date</p>
            <p className="font-bold" style={{color:NAVY}}>{issued}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Valid Until</p>
            <p className="font-bold" style={{color:NAVY}}>{validUntil}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <img src={qrUrl} alt="Verification QR" width={80} height={80} className="rounded border border-gray-300" />
        </div>
      </div>
    </div>
  );
}

function CertWatermark({ price }: { price: number }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 pointer-events-none"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}>
      <div className="text-center rotate-[-25deg] opacity-60 select-none" style={{userSelect:'none',WebkitUserSelect:'none'}}>
        {Array.from({length:8}).map((_,i)=>(
          <p key={i} className="text-lg font-black tracking-[0.3em] text-gray-300" style={{lineHeight:2.2}}>PREVIEW</p>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-5 text-center shadow-2xl pointer-events-auto select-none"
          style={{userSelect:'none',WebkitUserSelect:'none'}}>
          <Lock size={36} className="mx-auto mb-2 text-white/80" />
          <p className="text-white font-extrabold text-lg">Preview Only</p>
          <p className="text-white/60 text-sm mt-1">Pay {fmtRWF(price)} to unlock & download</p>
        </div>
      </div>
    </div>
  );
}

export default function SupplierCertificatePage() {
  const { user } = useAuth();
  const [cert, setCert] = useState<{
    cert_no?: string; status?: string; issued_date?: string; valid_until?: string;
    supplier_name?: string; supplier_photo?: string | null; photo_url?: string | null;
    business_name?: string | null; certificate_type_id?: number | null; type_price?: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadlineRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchCert = async () => {
    api.get('/supplier/certificate')
      .then(({ data }) => setCert(data.certificate))
      .catch(() => { setMsg('Could not load your certificate status. Please refresh.'); })
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
      await api.post('/supplier/certificate/upload-photo', formData);
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
      const { data } = await api.post('/supplier/certificate/pay', { phone, certificateTypeId: cert?.certificate_type_id });
      setMsg('Payment request sent. Approve on your phone.');

      // Poll for payment status (max 5 minutes)
      pollDeadlineRef.current = Date.now() + 300000;
      pollRef.current = setInterval(async () => {
        if (Date.now() > pollDeadlineRef.current) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaying(false);
          setMsg('Payment confirmation timed out. If you approved the payment, your certificate will appear shortly.');
          return;
        }
        try {
          const { data: statusData } = await api.get(`/supplier/certificate/payment-status/${data.referenceId}`);
          if (statusData.status === 'generated' || statusData.status === 'paid') {
            if (pollRef.current) clearInterval(pollRef.current);
            if (statusData.status === 'generated') {
              setMsg('Certificate is ready!');
            } else {
              setMsg('Payment successful! Waiting for admin to generate your certificate.');
            }
            await fetchCert();
            setPaying(false);
          } else if (statusData.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setMsg('Payment failed. Try again.');
            setPaying(false);
          }
        } catch {
          // Transient network error — keep polling until deadline
        }
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

  const supplierName = cert?.supplier_name || user?.name || 'Your Name';
  const supplierPhoto = cert?.supplier_photo || cert?.photo_url || null;
  const businessName = cert?.business_name || null;
  const certPrice = cert?.type_price ?? DEFAULT_PRICE;
  const certNo = cert?.cert_no || `ENA-SUP-${certYear}-${String(user?.id ?? '').padStart(4, '0')}`;

  if (loading) return (
    <div className="p-8 text-center"><p className="text-gray-400 animate-pulse">Loading...</p></div>
  );

  const status = cert?.status || 'pending';
  const isGenerated = status === 'generated';
  const hasPhoto = !!supplierPhoto;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto" onContextMenu={e => { if (!isGenerated) e.preventDefault(); }}>
      <style jsx global>{`
        @media print {
          html, body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #supplier-cert-print,
          #supplier-cert-print * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #supplier-cert-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            transform: none !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          @page { size: A4 portrait; margin: 8mm; }
        }
      `}</style>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Certificate</h1>
      <p className="text-sm text-gray-500 mb-6">
        {isGenerated
          ? 'Your official Verified Supplier certificate is ready.'
          : `Upload your photo, then pay ${fmtRWF(certPrice)} to unlock and download your official Verified Supplier certificate.`}
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

      {/* Certificate Preview — always visible */}
      <div className="relative mb-6">
        <CertPreview
          name={supplierName}
          businessName={businessName}
          photo={supplierPhoto}
          certNo={certNo}
          issued={issuedDisplay}
          validUntil={validUntilDisplay}
        />
        {!isGenerated && <CertWatermark price={certPrice} />}
      </div>

      {/* Photo upload section (before payment) */}
      {!isGenerated && status !== 'paid' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">
            {hasPhoto ? 'Update Your Photo' : 'Upload Your Photo'}
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            {hasPhoto
              ? 'You already have a photo. You can replace it or proceed to payment.'
              : 'Upload a passport-style photo to appear on your certificate.'}
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

      {/* Payment section (hidden if already generated) */}
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

      {/* Download button — only when generated */}
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
  );
}
