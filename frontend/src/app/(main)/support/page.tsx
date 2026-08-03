'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { MessageCircle, Mail, Phone, Send, MapPin, Clock, CheckCircle, Loader2, AlertCircle } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const CONTACT_INFO = [
  { icon: <MapPin size={18} />, label: 'Location', value: 'Kigali, Rwanda' },
  { icon: <Phone size={18} />, label: 'Phone', value: '+250 788 000 000' },
  { icon: <Mail size={18} />, label: 'Email', value: 'support@enyagasambu.rw' },
  { icon: <Clock size={18} />, label: 'Hours', value: 'Mon–Fri, 8:00–17:00' },
];

const FAQS = [
  { q: 'How do I create a listing?', a: 'Click "Posting" in the top bar, fill in the details about your product or service, and pay 400 coins to publish.' },
  { q: 'How do I buy coins?', a: 'Go to Coins & Wallet from your account menu, select a package, and pay via MTN MoMo or Airtel Money.' },
  { q: 'How do I contact a seller?', a: 'Open a listing you are interested in, click "Get Seller Contact", verify with OTP, and pay 300 RWF to reveal the phone number.' },
  { q: 'How do I become an ambassador?', a: 'Register as an ambassador via the Ambassador Registration link, then pay for your certificate to start referring and earning.' },
];

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SupportContent />
    </Suspense>
  );
}

function SupportContent() {
  const searchParams = useSearchParams();
  const listingFromQuery = searchParams.get('listing');
  const [form, setForm] = useState({ name: '', email: '', phone: '', category: '', subject: '', message: '', listingId: listingFromQuery || '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/support', {
        ...form,
        listingId: form.listingId ? parseInt(form.listingId) : undefined,
      });
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', category: '', subject: '', message: '', listingId: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="text-white py-16 px-4"
        style={{ background: `linear-gradient(135deg, ${NAVY} 60%, ${ORG} 100%)` }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <MessageCircle size={48} />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Support & Contact</h1>
          <p className="text-lg opacity-90 max-w-xl mx-auto">
            Have a question or need help? Reach out to us — we are here to assist you.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 grid lg:grid-cols-5 gap-10">

        {/* ── LEFT: Contact info + FAQ ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Contact cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: NAVY }}>Get in Touch</h2>
            {CONTACT_INFO.map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${NAVY}10` }}>
                  {icon}
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: NAVY }}>FAQs</h2>
            <div className="space-y-2">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="bg-gray-50 rounded-xl border border-gray-100 group">
                  <summary className="text-sm font-semibold text-gray-800 px-4 py-3 cursor-pointer list-none flex items-center justify-between">
                    {q}
                    <span className="text-xs transition group-open:rotate-180" style={{ color: ORG }}>▾</span>
                  </summary>
                  <p className="text-sm text-gray-500 px-4 pb-3 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="lg:col-span-3">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold mb-1" style={{ color: NAVY }}>Submit a Request</h2>
            <p className="text-sm text-gray-400 mb-6">Fill in the form below and we will get back to you.</p>

            {success ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#d1fae5' }}>
                  <CheckCircle size={32} style={{ color: '#059669' }} />
                </div>
                <p className="text-lg font-bold text-gray-800 mb-1">Request Submitted</p>
                <p className="text-sm text-gray-400 mb-6">We will respond to your inquiry shortly.</p>
                <button onClick={() => setSuccess(false)}
                  className="text-sm font-bold px-5 py-2.5 rounded-lg text-white transition hover:opacity-90"
                  style={{ background: ORG }}>
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {form.listingId && (
                  <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                    <AlertCircle size={16} /> You are requesting help about listing #{form.listingId}.
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-500">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition"
                      placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-500">Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition"
                      placeholder="you@example.com" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-500">Phone *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition"
                      placeholder="+250 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-500">Category *</label>
                    <select name="category" value={form.category} onChange={handleChange} required
                      className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition">
                      <option value="">Select a category</option>
                      <option value="payment">Payment</option>
                      <option value="listing">Listing</option>
                      <option value="access">Contact Access</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-500">Subject</label>
                  <input name="subject" value={form.subject} onChange={handleChange}
                    className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition"
                    placeholder="Short summary of your issue (optional)" />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-500">Description *</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required rows={5}
                    className="w-full rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition resize-y"
                    placeholder="Describe your issue or question in detail..." />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full text-white font-bold py-3.5 rounded-xl text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: ORG }}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="py-10 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
        <h3 className="text-xl font-semibold mb-3">Need immediate assistance?</h3>
        <p className="text-sm opacity-80 mb-4">Call us directly during business hours</p>
        <a href="tel:+250788000000"
          className="inline-flex items-center gap-2 bg-white font-bold px-6 py-2.5 rounded text-sm transition hover:opacity-90"
          style={{ color: NAVY }}>
          <Phone size={16} /> +250 788 000 000
        </a>
      </section>
    </div>
  );
}
