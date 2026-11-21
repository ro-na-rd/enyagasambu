'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AuthRegisterLayout from '@/components/AuthRegisterLayout';
import RegistrationGuard from '@/components/RegistrationGuard';
import { Store, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function SupplierRegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    business_name: '', email: '', password: '', confirmPassword: '',
  });
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [verificationCode, setVerificationCode] = useState('');
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = (setShow: (v: boolean) => void) => {
    setShow(prev => !prev);
  };

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
        business_name: form.business_name,
        email: form.email,
        password: form.password,
      });
      setSuccess(data.message || `Verification code sent to ${form.email}`);
      if (data.requires_email_verification) setStep('verify');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/supplier/verify-email', { email: form.email, code: verificationCode });
      localStorage.setItem('nmo_token', data.token);
      await refreshUser();
      router.replace('/supplier');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await api.post('/auth/supplier/resend-verification', { email: form.email });
      setSuccess('A new verification code has been sent to your email address.');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not resend the verification code.');
    } finally {
      setResending(false);
    }
  };

  const inputCls = "w-full rounded-xl pl-4 pr-4 py-3 text-sm bg-white border border-gray-200 outline-none focus:border-[#E85D04] transition";

  return (
    <RegistrationGuard>
      <AuthRegisterLayout badge="Supplier Program">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
          <Store size={22} style={{ color: '#fff' }} />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900">Supplier Registration</h1>
        <p className="text-sm text-gray-500 mt-1">Create your business account and verify its email address to start posting</p>
      </div>

          {success && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669' }}>
              <CheckCircle size={16} /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {step === 'register' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Business or Company Name *</label>
                <input name="business_name" value={form.business_name} onChange={handleChange} required maxLength={100} className={inputCls} placeholder="Your business or company name" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Business Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputCls} placeholder="business@example.com" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-500">Password *</label>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required maxLength={100} className={`${inputCls} pr-10`} placeholder="Min 6 characters" />
                    <button type="button" onClick={() => togglePasswordVisibility(setShowPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-500">Confirm Password *</label>
                  <div className="relative">
                    <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} required maxLength={100} className={`${inputCls} pr-10`} placeholder="Repeat password" />
                    <button type="button" onClick={() => togglePasswordVisibility(setShowConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full text-white font-bold py-3.5 rounded-xl text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Store size={16} />}
                {submitting ? 'Sending code...' : 'Register and Verify Email'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-gray-600">
                We sent a 6-digit code to <strong className="text-gray-900">{form.email}</strong>. Verify it to activate your supplier account.
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Email Verification Code *</label>
                <input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required inputMode="numeric" autoComplete="one-time-code" className={`${inputCls} text-center text-xl tracking-[0.4em]`} placeholder="000000" />
              </div>
              <button type="submit" disabled={submitting || verificationCode.length !== 6}
                className="w-full text-white font-bold py-3.5 rounded-xl text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Verify Email and Continue
              </button>
              <button type="button" onClick={handleResend} disabled={resending} className="w-full py-2 text-sm font-semibold disabled:opacity-50" style={{ color: ORG }}>
                {resending ? 'Sending a new code...' : 'Resend verification code'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: ORG }}>Sign in</Link>
          </p>
      </AuthRegisterLayout>
    </RegistrationGuard>
  );
}
