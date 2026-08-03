'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Store, Loader2, AlertCircle, CheckCircle } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function SupplierRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    business_name: '', business_phone: '', business_location: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/supplier/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        business_name: form.business_name || undefined,
        business_phone: form.business_phone || undefined,
        business_location: form.business_location || undefined,
      });
      localStorage.setItem('nmo_token', data.token);
      setSuccess(true);
      await login(form.email, form.password, 'supplier').catch(() => {});
      setTimeout(() => router.replace('/supplier'), 800);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-xl pl-4 pr-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${NAVY} 60%, ${ORG} 100%)` }}>
      <div className="w-full max-w-lg">
        <div className="h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${NAVY}, ${ORG})` }} />
        <div className="rounded-b-2xl p-8" style={{ background: '#ffffff', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
              <Store size={22} style={{ color: '#fff' }} />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">Supplier Registration</h1>
            <p className="text-sm text-gray-500 mt-1">Register your business to sell to the E-Nyagasambu marketplace</p>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669' }}>
              <CheckCircle size={16} /> Account created! Redirecting...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required className={inputCls} placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputCls} placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-500">Phone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} required className={inputCls} placeholder="+250 7XX XXX XXX" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Password *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required className={inputCls} placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Confirm Password *</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className={inputCls} placeholder="Repeat password" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Business Details</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-500">Business Name</label>
                  <input name="business_name" value={form.business_name} onChange={handleChange} className={inputCls} placeholder="Your business name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-500">Business Phone</label>
                  <input name="business_phone" value={form.business_phone} onChange={handleChange} className={inputCls} placeholder="Business contact" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Business Location</label>
                <input name="business_location" value={form.business_location} onChange={handleChange} className={inputCls} placeholder="e.g. Kigali, Nyarugenge" />
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full text-white font-bold py-3.5 rounded-xl text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Store size={16} />}
              {submitting ? 'Creating account...' : 'Register as Supplier'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: ORG }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
