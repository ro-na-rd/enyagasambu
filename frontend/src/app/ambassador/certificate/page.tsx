'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Award, Check } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function AmbassadorCertificatePage() {
  const { user } = useAuth();
  const [cert, setCert] = useState<{ cert_no?: string; status?: string; issued_date?: string; valid_until?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCert = async () => {
    try {
      const { data } = await api.get('/ambassador/certificate');
      setCert(data.certificate);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCert(); }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handlePay = async () => {
    if (!phone) return setMsg('Enter your MoMo phone number');
    setPaying(true);
    setMsg('');
    try {
      const { data } = await api.post('/ambassador/certificate/pay', { phone });
      setMsg('Payment request sent. Approve on your phone.');
      pollRef.current = setInterval(async () => {
        try {
          const { data: statusData } = await api.get(`/ambassador/certificate/payment-status/${data.referenceId}`);
          if (statusData.status === 'paid') {
            clearInterval(pollRef.current);
            setMsg('Payment successful! Waiting for admin to generate your certificate.');
            await fetchCert();
            setPaying(false);
          } else if (statusData.status === 'failed') {
            clearInterval(pollRef.current);
            setMsg('Payment failed. Try again.');
            setPaying(false);
          }
        } catch { clearInterval(pollRef.current); setPaying(false); }
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

  if (loading) return (
    <div className="p-8 text-center"><p className="text-gray-400 animate-pulse">Loading...</p></div>
  );

  const status = cert?.status || 'none';

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Certificate</h1>
      <p className="text-sm text-gray-500 mb-6">Pay 2,000 RWF and receive your official ambassador certificate. Your name will be taken from your registration.</p>

      {msg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3 mb-6">{msg}</div>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-6 text-xs font-semibold">
        {['pay', 'certificate'].map((s, i) => {
          const steps = ['pay', 'certificate'];
          const curIdx = status === 'generated' ? 1 : (status === 'paid' ? 1 : (status === 'pending' || status === 'none' ? 0 : 0));
          const done = i <= curIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'text-white' : 'text-gray-400 bg-gray-200'}`}
                style={done ? { background: s === 'certificate' && status === 'generated' ? ORG : NAVY } : {}}>
                {done ? <Check size={12} /> : i + 1}
              </span>
              <span className={done ? 'text-gray-800' : 'text-gray-400'}>{s === 'pay' ? 'Pay' : 'Certificate'}</span>
              {i < steps.length - 1 && <span className="text-gray-300 mx-1">—</span>}
            </div>
          );
        })}
      </div>

      {/* Step 1: Pay */}
      {status !== 'generated' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">
            {status === 'paid' ? 'Payment Received' : '1. Pay 2,000 RWF'}
          </h2>
          {status === 'paid' ? (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
              Payment received! Waiting for admin to generate your certificate.
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">Pay via MTN MoMo to get your certificate generated. Your name will be taken from your registration.</p>
              <div className="flex items-center gap-3">
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="078xxxxxxx" className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20" />
                <button onClick={handlePay} disabled={paying}
                  className="text-sm px-6 py-2.5 rounded-lg text-white font-bold transition disabled:opacity-50"
                  style={{ background: ORG }}>
                  {paying ? 'Processing...' : 'Pay 2,000 RWF'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: View Certificate */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">
          {status === 'generated' ? '2. Your Certificate' : 'Certificate Preview'}
        </h2>
        {status === 'generated' ? (
          <div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200" id="cert-print-area">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: NAVY }}>
                  <span className="text-white text-2xl font-black">E</span>
                </div>
                <h3 className="text-lg font-extrabold" style={{ color: NAVY }}>E-NYAGASAMBU</h3>
                <p className="text-xs" style={{ color: ORG }}>DIGITAL MARKET PLACE</p>
              </div>
              <div className="text-center mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Certificate of Appointment</p>
                <p className="text-3xl font-bold" style={{ color: NAVY }}>{user?.name}</p>
                <div className="w-24 h-1 mx-auto my-3" style={{ background: ORG }}></div>
                <p className="text-lg font-bold" style={{ color: ORG }}>BRAND AMBASSADOR</p>
                <p className="text-sm text-gray-500 mt-2">E-Nyagasambu Digital Marketplace</p>
              </div>
              <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500 space-y-1">
                <p><strong>Certificate No:</strong> {cert.cert_no}</p>
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Issued:</strong> {issuedDisplay}</p>
                <p><strong>Valid Until:</strong> {validUntilDisplay}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">Only admin can print this certificate.</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-3"><Award size={48} className="mx-auto text-gray-300" /></p>
            <p className="text-sm">
              {status === 'none' ? 'Pay 2,000 RWF to generate your certificate.' :
               status === 'paid' ? 'Payment received. Certificate is being prepared.' :
               'Certificate is being generated.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
