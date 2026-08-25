'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FileText, Award, Search, Filter } from '@/lib/icons';
import { SITE_DOMAIN } from '@/lib/config';
import { buildAmbassadorCertPrintHtml } from '@/lib/ambassadorCertPrint';
import { generateQrDataUrl } from '@/components/QrCode';
import AmbassadorCertificate from '@/components/AmbassadorCertificate';
import BrokerCertificate from '@/components/BrokerCertificate';
import { useCurrency } from '@/context/CurrencyContext';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};
const BASE_URL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5500';

type CertType = 'ambassador' | 'broker' | 'supplier';
const CERT_TYPES: { value: CertType; label: string }[] = [
  { value: 'ambassador', label: 'Ambassador Certificates' },
  { value: 'broker', label: 'Broker Certificates' },
  { value: 'supplier', label: 'Supplier Certificates' },
];

const statusBadge = (s: string) => {
  const m: Record<string, string> = { pending: 'bg-yellow-500/10 text-yellow-400', paid: 'bg-blue-500/10 text-blue-400', generated: 'bg-green-500/10 text-green-400' };
  return `text-[11px] font-bold px-2.5 py-1 rounded-full ${m[s] || 'bg-gray-500/10 text-gray-600'}`;
};

export default function AdminCertificatesPage() {
  const { format } = useCurrency();
  const [type, setType] = useState<CertType>('ambassador');
  const [certs, setCerts] = useState<{ id: number; cert_no?: string; status: string; user_name: string; user_email: string; user_phone?: string; photo_url?: string; phone?: string; created_at: string; issued_date?: string; valid_until?: string; amount_rwf?: number; type_name?: string; type_code?: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ id: number; cert_no?: string; status: string; user_name: string; user_email: string; user_phone?: string; photo_url?: string; broker_phone?: string; issued_date?: string; valid_until?: string; generated_by_name?: string; amount_rwf?: number; type_name?: string; type_code?: string } | null>(null);
  const [msg, setMsg] = useState('');

  const endpoint = type === 'ambassador' ? '/admin/certificates' : type === 'broker' ? '/admin/broker-certificates' : '/admin/supplier-certificates';
  const printEndpoint = endpoint;

  const [prevType, setPrevType] = useState<CertType>(type);
  if (prevType !== type) {
    setPrevType(type);
    setPage(1);
    setDetail(null);
  }

  const fetchCerts = async () => {
    const params: Record<string, string | number> = { page };
    if (filter) params.status = filter;
    api.get(endpoint, { params })
      .then(({ data }) => {
        setCerts(data.certificates);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCerts(); }, [page, filter, type]);

  const handleGenerate = async (id: number) => {
    if (!confirm('Generate this certificate?')) return;
    setMsg('');
    try {
      const { data } = await api.post(`${printEndpoint}/${id}/generate`);
      setMsg(`Certificate ${data.certificate.cert_no} generated!`);
      fetchCerts();
      setDetail(null);
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : 'Failed to generate'));
    }
  };

  const handleConfirmPayment = async (id: number) => {
    if (!confirm('Confirm payment for this certificate?')) return;
    setMsg('');
    try {
      const { data } = await api.post(`${printEndpoint}/${id}/confirm-payment`);
      setMsg(data.message);
      fetchCerts();
      setDetail(null);
    } catch (err: unknown) {
      setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : 'Failed to confirm payment'));
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const { data } = await api.get(`${printEndpoint}/${id}`);
      setDetail(data.certificate);
    } catch { }
  };

  const handlePrint = async (certNo: string) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const c = detail || certs.find(x => x.cert_no === certNo);
    if (!c) return;
    const issued = c.issued_date
      ? new Date(c.issued_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : '-';
    const valid = c.valid_until
      ? new Date(c.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : '-';

    if (type === 'ambassador') {
      const html = await buildAmbassadorCertPrintHtml({
        name: c.user_name,
        certNo: c.cert_no || certNo,
        issued,
        validUntil: valid,
      });
      printWin.document.write(html);
      printWin.document.close();
      return;
    }

    if (type === 'broker') {
      const verifyUrl = `https://${SITE_DOMAIN}/verify-broker/${c.cert_no || certNo}`;
      const qrUrl = await generateQrDataUrl(verifyUrl, { size: 130, color: '#1B2A5E', bgColor: '#ffffff', margin: 4 });
      const photoHtml = c.photo_url
        ? `<img src="${BASE_URL}${c.photo_url}" style="width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid #fff;" />`
        : `<svg width="46" height="46" viewBox="0 0 24 24" fill="#98a1bd"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;

      printWin.document.write(`<!DOCTYPE html><html><head><title>Broker Certificate - ${c.cert_no}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Literata:wght@700;900&display=swap');
body { font-family: 'Poppins', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.card { width: 520px; height: 300px; border-radius: 18px; overflow: hidden; position: relative; box-shadow: 0 22px 45px rgba(10,20,50,0.25); }
.front { background: #0e1f4b; }
.front .skew1 { position: absolute; top: 0; right: -30px; bottom: 0; width: 52%; background: #0e1f4b; transform: skewX(-12deg); transform-origin: top right; }
.front .skew2 { position: absolute; top: 0; right: -90px; bottom: 0; width: 52%; background: #f2701c; transform: skewX(-12deg); transform-origin: top right; }
.front .content { position: relative; z-index: 2; display: flex; height: 100%; padding: 26px; gap: 12px; }
.front .left { flex: 1.6; display: flex; flex-direction: column; }
.front .right { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 4px 0; }
.brand { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; }
.brand img { width: 38px; height: 38px; object-fit: contain; }
.brand-name { font-weight: 900; font-size: 14.5px; letter-spacing: 0.5px; color: #fff; line-height: 1.15; font-family: 'Literata', serif; }
.brand-tag { font-size: 7px; font-weight: 600; letter-spacing: 1.8px; color: #ffb585; }
.badge { background: #f2701c; color: #fff; font-weight: 800; font-size: 11.5px; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 6px; display: inline-block; margin-bottom: 12px; }
.name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.name-row svg { fill: #ffb585; }
.name-text { font-weight: 700; font-size: 18px; color: #fff; }
.info-row { display: flex; align-items: center; gap: 9px; font-size: 11.5px; margin-bottom: 8px; }
.info-icon { width: 20px; height: 20px; border-radius: 6px; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.info-icon svg { fill: #f2701c; width: 12px; height: 12px; }
.info-label { color: #c6cde6; min-width: 52px; }
.info-val { color: #fff; font-weight: 600; }
.photo-wrap { border-radius: 50%; background: #f2701c; padding: 4px; box-shadow: 0 6px 14px rgba(0,0,0,0.25); }
.photo { width: 84px; height: 84px; border-radius: 50%; border: 3px solid #fff; overflow: hidden; background: #dfe3ef; display: flex; align-items: center; justify-content: center; }
.photo img { width: 100%; height: 100%; object-fit: cover; }
.qr-wrap { text-align: center; }
.qr { background: #fff; border-radius: 8px; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.12); display: inline-block; }
.qr-label { font-size: 7px; font-weight: 700; color: #ffb585; letter-spacing: 0.8px; margin-top: 3px; }
.back { background: #fdfdfc; }
.back .accent1 { position: absolute; left: -60px; top: -45px; width: 110px; height: 110px; transform: rotate(45deg); background: #f2701c; opacity: 0.9; }
.back .accent2 { position: absolute; right: -50px; top: 24px; width: 110px; height: 110px; transform: rotate(45deg); background: #0e1f4b; opacity: 0.08; }
.back .content { position: relative; z-index: 2; display: flex; flex-direction: column; height: 100%; padding: 26px 28px 0; }
.back .row { display: flex; flex: 1; gap: 18px; }
.services { flex: 1.15; }
.services-title { background: #0e1f4b; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 6px; display: inline-block; margin-bottom: 14px; }
.service-item { display: flex; align-items: center; gap: 9px; font-size: 11.5px; color: #0e1f4b; font-weight: 600; margin-bottom: 9px; }
.service-check { width: 16px; height: 16px; border-radius: 50%; background: #f2701c; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; }
.contact { flex: 1; display: flex; flex-direction: column; gap: 14px; padding-top: 30px; }
.contact-item { display: flex; gap: 9px; align-items: flex-start; }
.contact-icon { color: #f2701c; margin-top: 1px; flex-shrink: 0; }
.contact-icon svg { fill: #f2701c; width: 14px; height: 14px; }
.contact-label { font-size: 9.5px; color: #5c6684; font-weight: 600; }
.contact-val { font-size: 11.5px; color: #0e1f4b; font-weight: 700; }
.banner { position: relative; margin: 0 -28px; background: #0e1f4b; padding: 11px 28px; overflow: hidden; }
.banner-skew { position: absolute; right: -10px; top: 0; bottom: 0; width: 80px; transform: skewX(-12deg); background: #f2701c; }
.banner-text { position: relative; margin: 0; font-size: 11px; font-weight: 600; font-style: italic; color: #ffb585; letter-spacing: 0.4px; }
</style></head><body>
<div class="card front">
  <div class="skew1"></div>
  <div class="skew2"></div>
  <div class="content">
    <div class="left">
      <div class="brand">
        <img src="/assets/logo.png" alt="E-Nyagasambu" />
        <div>
          <div class="brand-name">E-NYAGASAMBU</div>
          <div class="brand-tag">DIGITAL MARKET PLACE</div>
        </div>
      </div>
      <div class="badge">CERTIFIED BROKER</div>
      <div class="name-row">
        <svg width="17" height="17" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        <span class="name-text">${c.user_name}</span>
      </div>
      <div class="info-row"><div class="info-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div><span class="info-label">Broker ID</span><span class="info-val">: ${c.cert_no || certNo}</span></div>
      <div class="info-row"><div class="info-icon"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div><span class="info-label">District</span><span class="info-val">: Kigali City</span></div>
      <div class="info-row"><div class="info-icon"><svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></div><span class="info-label">Phone</span><span class="info-val">: ${c.user_phone || 'N/A'}</span></div>
      <div class="info-row"><div class="info-icon"><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></div><span class="info-label">Email</span><span class="info-val">: ${c.user_email}</span></div>
    </div>
    <div class="right">
      <div class="photo-wrap"><div class="photo">${photoHtml}</div></div>
      <div class="qr-wrap">
        <div class="qr"><img src="${qrUrl}" width="54" height="54" /></div>
        <div class="qr-label">SCAN TO VERIFY</div>
      </div>
    </div>
  </div>
</div>
<div class="card back">
  <div class="accent1"></div>
  <div class="accent2"></div>
  <div class="content">
    <div class="row">
      <div class="services">
        <div class="services-title">AUTHORIZED SERVICES</div>
        <div class="service-item"><span class="service-check">✓</span>Product Brokerage</div>
        <div class="service-item"><span class="service-check">✓</span>Property Brokerage</div>
        <div class="service-item"><span class="service-check">✓</span>Vehicle Brokerage</div>
        <div class="service-item"><span class="service-check">✓</span>Marketplace Verification</div>
        <div class="service-item"><span class="service-check">✓</span>Customer Support</div>
      </div>
      <div class="contact">
        <div class="contact-item"><div class="contact-icon"><svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zM5.08 16h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg></div><div><div class="contact-label">Website</div><div class="contact-val">www.${SITE_DOMAIN}</div></div></div>
        <div class="contact-item"><div class="contact-icon"><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></div><div><div class="contact-label">Email</div><div class="contact-val">info@${SITE_DOMAIN}</div></div></div>
        <div class="contact-item"><div class="contact-icon"><svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></div><div><div class="contact-label">Emergency Contact</div><div class="contact-val">+250 788 300 003</div></div></div>
      </div>
    </div>
    <div class="banner"><div class="banner-skew"></div><p class="banner-text">Building Trust. Connecting Opportunities. Growing Together.</p></div>
  </div>
</div>
<script>window.onload = function() { window.print(); window.close(); }</script>
</body></html>`);
      printWin.document.close();
      return;
    }

    const photoHtml = c.photo_url
      ? `<img src="${BASE_URL}${c.photo_url}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid ${BRAND.navy};margin:0 auto 16px;display:block;" />`
      : '';

    const title = 'VERIFIED SUPPLIER';
    const description = 'This certifies that the above-named supplier has been officially verified on E-Nyagasambu Digital Marketplace, building buyer trust by confirming the authenticity of their supplier account and business.';
    const heading = 'CERTIFICATE OF VERIFICATION';
    const businessHtml = (c as { business_name?: string }).business_name
      ? `<div style="text-align:center;font-size:20px;color:${BRAND.orange};font-weight:bold;margin-bottom:8px;">${(c as { business_name?: string }).business_name}</div>`
      : '';
    const supplierQrUrl = await generateQrDataUrl(`https://${SITE_DOMAIN}/verify/${c.cert_no}`, { size: 100, color: '#0f1e42', bgColor: '#ffffff' });

    printWin.document.write(`<!DOCTYPE html><html><head><title>Certificate - ${c.cert_no}</title>
<style>
body { font-family: 'Georgia',serif; margin: 0; padding: 40px; background: #f5f5f5; display: flex; justify-content: center; }
.cert { width: 800px; background: #fff; border: 2px solid #0f1e42; padding: 40px; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.cert:before, .cert:after { content: ''; position: absolute; width: 100px; height: 100px; border: 3px solid ${BRAND.orange}; }
.cert:before { top: 10px; left: 10px; border-right: none; border-bottom: none; }
.cert:after { bottom: 10px; right: 10px; border-left: none; border-top: none; }
h1 { text-align: center; font-size: 14px; color: #666; letter-spacing: 4px; margin-bottom: 4px; }
h2 { text-align: center; font-size: 36px; color: ${BRAND.navy}; margin: 8px 0; }
.sub { text-align: center; font-size: 18px; color: ${BRAND.orange}; font-weight: bold; letter-spacing: 2px; margin-bottom: 20px; }
.name { text-align: center; font-size: 42px; color: ${BRAND.navy}; border-bottom: 2px solid ${BRAND.orange}; padding-bottom: 8px; margin: 16px 40px; }
.desc { text-align: center; font-size: 14px; color: #555; margin-bottom: 24px; }
.details { display: flex; justify-content: center; gap: 40px; margin-top: 24px; font-size: 13px; }
.details div { text-align: center; }
.details strong { color: ${BRAND.navy}; display: block; font-size: 11px; letter-spacing: 1px; margin-bottom: 2px; color: ${BRAND.orange}; }
.footer { text-align: center; margin-top: 32px; font-size: 12px; color: #888; border-top: 1px dashed #ccc; padding-top: 16px; }
</style></head><body>
<div class="cert">
<img src="${supplierQrUrl}" style="position:absolute;top:20px;right:30px;width:80px;" />
<h1>E-NYAGASAMBU LTD</h1>
<h2>${heading}</h2>
<div class="sub">${title}</div>
${photoHtml}
${businessHtml}
<div class="name">${c.user_name}</div>
<div class="desc">${description}</div>
<div class="details">
<div><strong>CERTIFICATE NO</strong> ${c.cert_no}</div>
<div><strong>ISSUE DATE</strong> ${issued}</div>
<div><strong>VALID UNTIL</strong> ${valid}</div>
</div>
<div class="footer">E-Nyagasambu Digital Marketplace &bull; www.${SITE_DOMAIN} &bull; Kigali, Rwanda</div>
</div>
<script>window.onload = function() { window.print(); window.close(); }</script>
</body></html>`);
    printWin.document.close();
  };

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <Award size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Certificates</h1>
            <p className="text-sm text-gray-600 mt-0.5">{total} total</p>
          </div>
        </div>
        <Link href="/admin/certificates/types" className="text-xs font-bold px-4 py-2 rounded-lg text-white transition hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}>
          Manage Certificate Types
        </Link>
      </div>

      {msg && (
        <div className="bg-green-900/30 border border-green-700/50 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-lg p-1 w-fit"
        style={{ background: '#f6f8fa' }}>
        {CERT_TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${type === t.value ? 'text-white' : 'text-gray-600 hover:text-gray-700'}`}
            style={type === t.value ? { background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'paid', 'generated'].map(s => (
          <button key={s} onClick={() => { setLoading(true); setFilter(s); setPage(1); }}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${filter === s ? 'text-white' : 'text-gray-600 border'}`}
            style={filter === s
              ? { background: BRAND.orange }
              : { borderColor: '#d0d7de', background: 'transparent' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className={`rounded-2xl w-full p-6 shadow-xl overflow-y-auto max-h-[90vh] ${type === 'ambassador' ? 'max-w-[1200px]' : type === 'broker' ? 'max-w-3xl' : 'max-w-lg'}`} style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Certificate Detail</h3>
              <button onClick={() => setDetail(null)} className="text-gray-600 hover:text-gray-700 text-xl">&times;</button>
            </div>
            {type === 'ambassador' && (
              <div className="mb-5 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
                <AmbassadorCertificate
                  id={`admin-ambassador-cert-${detail.id}`}
                  name={detail.user_name}
                  certNo={detail.cert_no || `ENA-AMB-${new Date().getFullYear()}-0001`}
                  issued={detail.issued_date
                    ? new Date(detail.issued_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  validUntil={detail.valid_until
                    ? new Date(detail.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                    : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                />
              </div>
            )}
            {type === 'broker' && (
              <div className="mb-5 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
                <BrokerCertificate
                  id={`admin-broker-cert-${detail.id}`}
                  name={detail.user_name}
                  brokerId={detail.cert_no || `ENA-BRK-${new Date().getFullYear()}-0001`}
                  email={detail.user_email}
                  phone={detail.user_phone || detail.broker_phone}
                  photo={detail.photo_url ? `${BASE_URL}${detail.photo_url}` : null}
                />
              </div>
            )}
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-600">Name:</span> <span className="font-semibold text-gray-800">{detail.user_name}</span></div>
              <div><span className="text-gray-600">Email:</span> <span className="text-gray-700">{detail.user_email}</span></div>
              <div><span className="text-gray-600">Phone:</span> <span className="text-gray-700">{detail.user_phone || '-'}</span></div>
              {detail.type_name && <div><span className="text-gray-600">Type:</span> <span className="text-gray-700">{detail.type_name}</span></div>}
              {typeof detail.amount_rwf === 'number' && (
                <div><span className="text-gray-600">Fee:</span> <span className="text-gray-700 font-semibold">{format(detail.amount_rwf)}</span></div>
              )}
              <div><span className="text-gray-600">Cert No:</span> <span className="text-gray-700">{detail.cert_no || '-'}</span></div>
              <div><span className="text-gray-600">Status:</span> <span className={statusBadge(detail.status)}>{detail.status}</span></div>
              <div><span className="text-gray-600">Issued:</span> <span className="text-gray-700">{detail.issued_date || '-'}</span></div>
              <div><span className="text-gray-600">Valid Until:</span> <span className="text-gray-700">{detail.valid_until || '-'}</span></div>
              {detail.generated_by_name && <div><span className="text-gray-600">Generated By:</span> <span className="text-gray-700">{detail.generated_by_name}</span></div>}
              {detail.photo_url && (
                <div><span className="text-gray-600">Photo:</span><br/>
                  <img src={`${BASE_URL}${detail.photo_url}`} alt="" className="w-20 h-20 rounded-full object-cover mt-1 border border-gray-200" />
                </div>
              )}
              {type === 'broker' && detail.broker_phone && (
                <div><span className="text-gray-600">Payment Phone:</span> <span className="text-gray-700">{detail.broker_phone}</span></div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              {detail.status === 'pending' && (
                <button onClick={() => handleConfirmPayment(detail.id)}
                  className="flex-1 text-sm font-bold px-4 py-2.5 rounded-lg text-white transition hover:opacity-90"
                  style={{ background: '#15803d' }}>
                  Confirm Payment & Generate
                </button>
              )}
              {detail.status === 'paid' && (
                <button onClick={() => handleGenerate(detail.id)}
                  className="flex-1 text-sm font-bold px-4 py-2.5 rounded-lg text-white transition hover:opacity-90"
                  style={{ background: BRAND.orange }}>
                  Generate Certificate
                </button>
              )}
              {detail.status === 'generated' && (
                <button onClick={() => detail.cert_no && handlePrint(detail.cert_no)}
                  className="flex-1 text-sm font-bold px-4 py-2.5 rounded-lg text-white transition hover:opacity-90"
                  style={{ background: BRAND.navy }}>
                  <FileText size={14} className="inline mr-1" /> Print Certificate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase font-semibold tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase font-semibold tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase font-semibold tracking-wider">Cert No</th>
                <th className="px-4 py-3 text-center text-gray-500 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-gray-500 text-xs uppercase font-semibold tracking-wider">Photo</th>
                {type === 'broker' && <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase font-semibold tracking-wider">Phone</th>}
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase font-semibold tracking-wider">Date</th>
                <th className="px-4 py-3 text-center text-gray-500 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={type === 'broker' ? 8 : 7} className="text-center py-12 text-gray-600">Loading...</td></tr>
              ) : certs.length === 0 ? (
                <tr><td colSpan={type === 'broker' ? 8 : 7} className="text-center py-12 text-gray-600">No certificates found</td></tr>
              ) : certs.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5 font-medium text-gray-800">{c.user_name}</td>
                  <td className="px-4 py-3.5 text-gray-600 text-xs">
                    {c.type_name ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-gray-800 font-semibold">{c.type_name}</span>
                        <span className="text-gray-400">·</span>
                        <span className="font-mono">{format(c.amount_rwf ?? 0)}</span>
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{c.cert_no || '-'}</td>
                  <td className="px-4 py-3.5 text-center"><span className={statusBadge(c.status)}>{c.status}</span></td>
                  <td className="px-4 py-3.5 text-center">
                    {c.photo_url ? (
                      <img src={`${BASE_URL}${c.photo_url}`} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200 mx-auto" />
                    ) : <span className="text-gray-700">-</span>}
                  </td>
                  {type === 'broker' && (
                    <td className="px-4 py-3.5 text-gray-600 text-xs">{c.phone || '-'}</td>
                  )}
                  <td className="px-4 py-3.5 text-gray-600 text-xs">
                    {new Date(c.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-center">
                      <button onClick={() => viewDetail(c.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition"
                        style={{ borderColor: '#d0d7de', color: '#6e7781' }}>
                        View
                      </button>
                      {c.status === 'pending' && (
                        <button onClick={() => handleConfirmPayment(c.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
                          style={{ background: '#15803d' }}>
                          Confirm & Generate
                        </button>
                      )}
                      {c.status === 'paid' && (
                        <button onClick={() => handleGenerate(c.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
                          style={{ background: BRAND.orange }}>
                          Generate
                        </button>
                      )}
                      {c.status === 'generated' && (
                        <button onClick={() => c.cert_no && handlePrint(c.cert_no)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
                          style={{ background: BRAND.navy }}>
                          Print
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-200"
            style={{ background: '#f0f2f5' }}>
            <button disabled={page <= 1} onClick={() => { setLoading(true); setPage(p => p - 1); }}
              className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40"
              style={{ borderColor: '#d0d7de', color: '#6e7781', background: '#f6f8fa' }}>Prev</button>
            <span className="text-xs text-gray-600">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => { setLoading(true); setPage(p => p + 1); }}
              className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40"
              style={{ borderColor: '#d0d7de', color: '#6e7781', background: '#f6f8fa' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
