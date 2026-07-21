'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FileText, Award, Search, Filter } from '@/lib/icons';
import { SITE_DOMAIN } from '@/lib/config';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};
const BASE_URL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';

type CertType = 'ambassador' | 'broker';
const CERT_TYPES: { value: CertType; label: string }[] = [
  { value: 'ambassador', label: 'Ambassador Certificates' },
  { value: 'broker', label: 'Broker Certificates' },
];

const statusBadge = (s: string) => {
  const m: Record<string, string> = { pending: 'bg-yellow-500/10 text-yellow-400', paid: 'bg-blue-500/10 text-blue-400', generated: 'bg-green-500/10 text-green-400' };
  return `text-[11px] font-bold px-2.5 py-1 rounded-full ${m[s] || 'bg-gray-500/10 text-gray-500'}`;
};

export default function AdminCertificatesPage() {
  const [type, setType] = useState<CertType>('ambassador');
  const [certs, setCerts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const endpoint = type === 'ambassador' ? '/admin/certificates' : '/admin/broker-certificates';
  const printEndpoint = type === 'ambassador' ? '/admin/certificates' : '/admin/broker-certificates';

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (filter) params.status = filter;
      const { data } = await api.get(endpoint, { params });
      setCerts(data.certificates);
      setTotal(data.total);
      setPages(data.pages);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); setDetail(null); }, [type]);
  useEffect(() => { fetchCerts(); }, [page, filter, type]);

  const handleGenerate = async (id: number) => {
    if (!confirm('Generate this certificate?')) return;
    setMsg('');
    try {
      const { data } = await api.post(`${printEndpoint}/${id}/generate`);
      setMsg(`Certificate ${data.certificate.cert_no} generated!`);
      fetchCerts();
      setDetail(null);
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to generate');
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
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to confirm payment');
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const { data } = await api.get(`${printEndpoint}/${id}`);
      setDetail(data.certificate);
    } catch { }
  };

  const handlePrint = (certNo: string) => {
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
    const photoHtml = c.photo_url
      ? `<img src="${BASE_URL}${c.photo_url}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid ${BRAND.navy};margin:0 auto 16px;display:block;" />`
      : '';

    const title = type === 'ambassador' ? 'BRAND AMBASSADOR' : 'CERTIFIED BROKER';
    const description = type === 'ambassador'
      ? 'This certifies that the above-named individual has been officially appointed as a Brand Ambassador of E-Nyagasambu Digital Marketplace, in recognition of their dedication to promoting digital commerce and supporting local businesses.'
      : 'This certifies that the above-named individual is a Certified Broker of E-Nyagasambu Digital Marketplace, authorized to facilitate transactions, connect buyers and sellers, and provide trusted marketplace services.';

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
<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://' + SITE_DOMAIN + '/verify/' + c.cert_no)}" style="position:absolute;top:20px;right:30px;width:80px;" />
<h1>E-NYAGASAMBU LTD</h1>
<h2>CERTIFICATE OF APPOINTMENT</h2>
<div class="sub">${title}</div>
${photoHtml}
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
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <Award size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Certificates</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="bg-green-900/30 border border-green-700/50 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-lg p-1 w-fit"
        style={{ background: '#21262d' }}>
        {CERT_TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${type === t.value ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            style={type === t.value ? { background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'paid', 'generated'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${filter === s ? 'text-white' : 'text-gray-500 border'}`}
            style={filter === s
              ? { background: BRAND.orange }
              : { borderColor: '#30363d', background: 'transparent' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="rounded-2xl max-w-lg w-full p-6 shadow-xl" style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-100">Certificate Detail</h3>
              <button onClick={() => setDetail(null)} className="text-gray-500 hover:text-gray-300 text-xl">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="font-semibold text-gray-200">{detail.user_name}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="text-gray-300">{detail.user_email}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="text-gray-300">{detail.user_phone || '-'}</span></div>
              <div><span className="text-gray-500">Cert No:</span> <span className="text-gray-300">{detail.cert_no || '-'}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className={statusBadge(detail.status)}>{detail.status}</span></div>
              <div><span className="text-gray-500">Issued:</span> <span className="text-gray-300">{detail.issued_date || '-'}</span></div>
              <div><span className="text-gray-500">Valid Until:</span> <span className="text-gray-300">{detail.valid_until || '-'}</span></div>
              {detail.generated_by_name && <div><span className="text-gray-500">Generated By:</span> <span className="text-gray-300">{detail.generated_by_name}</span></div>}
              {detail.photo_url && (
                <div><span className="text-gray-500">Photo:</span><br/>
                  <img src={`${BASE_URL}${detail.photo_url}`} alt="" className="w-20 h-20 rounded-full object-cover mt-1 border border-white/10" />
                </div>
              )}
              {type === 'broker' && detail.broker_phone && (
                <div><span className="text-gray-500">Payment Phone:</span> <span className="text-gray-300">{detail.broker_phone}</span></div>
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
                <button onClick={() => handlePrint(detail.cert_no)}
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
      <div className="rounded-xl overflow-hidden" style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]" style={{ background: '#1c2333' }}>
                <th className="px-4 py-3 text-left text-gray-400 text-xs uppercase font-semibold tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-gray-400 text-xs uppercase font-semibold tracking-wider">Cert No</th>
                <th className="px-4 py-3 text-center text-gray-400 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-gray-400 text-xs uppercase font-semibold tracking-wider">Photo</th>
                {type === 'broker' && <th className="px-4 py-3 text-left text-gray-400 text-xs uppercase font-semibold tracking-wider">Phone</th>}
                <th className="px-4 py-3 text-left text-gray-400 text-xs uppercase font-semibold tracking-wider">Date</th>
                <th className="px-4 py-3 text-center text-gray-400 text-xs uppercase font-semibold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={type === 'broker' ? 7 : 6} className="text-center py-12 text-gray-500">Loading...</td></tr>
              ) : certs.length === 0 ? (
                <tr><td colSpan={type === 'broker' ? 7 : 6} className="text-center py-12 text-gray-500">No certificates found</td></tr>
              ) : certs.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3.5 font-medium text-gray-200">{c.user_name}</td>
                  <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{c.cert_no || '-'}</td>
                  <td className="px-4 py-3.5 text-center"><span className={statusBadge(c.status)}>{c.status}</span></td>
                  <td className="px-4 py-3.5 text-center">
                    {c.photo_url ? (
                      <img src={`${BASE_URL}${c.photo_url}`} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10 mx-auto" />
                    ) : <span className="text-gray-600">-</span>}
                  </td>
                  {type === 'broker' && (
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{c.phone || '-'}</td>
                  )}
                  <td className="px-4 py-3.5 text-gray-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-center">
                      <button onClick={() => viewDetail(c.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition"
                        style={{ borderColor: '#30363d', color: '#8b949e' }}>
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
                        <button onClick={() => handlePrint(c.cert_no)}
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
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/[0.06]"
            style={{ background: '#1c2333' }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40"
              style={{ borderColor: '#30363d', color: '#8b949e', background: '#21262d' }}>Prev</button>
            <span className="text-xs text-gray-500">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40"
              style={{ borderColor: '#30363d', color: '#8b949e', background: '#21262d' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
