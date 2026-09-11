'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import AuthRegisterLayout from '@/components/AuthRegisterLayout';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from '@/lib/icons';

interface RegisterForm {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (form: RegisterForm) => {
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || undefined,
        password: form.password,
        referral_code: searchParams.get('ref') || undefined,
      });
      localStorage.setItem('nmo_token', data.token);
      setSuccess(true);
      window.setTimeout(() => router.push('/'), 900);
    } catch (err: unknown) {
      const responseMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(responseMessage || 'We could not create your account. Please try again.');
    }
  };

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10';

  return (
    <AuthRegisterLayout badge="Create account">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <User size={22} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Join E-Nyagasambu</h1>
          <p className="mt-1.5 text-sm text-gray-500">Create a free account to explore and connect.</p>
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div role="status" className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={16} className="shrink-0" /> Account created. Redirecting you now...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Full name" error={errors.name?.message} icon={<User size={16} />}>
            <input {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Enter at least 2 characters' } })} className={inputClass} placeholder="Your full name" autoComplete="name" />
          </Field>
          <Field label="Email address" error={errors.email?.message} icon={<Mail size={16} />}>
            <input type="email" {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} className={inputClass} placeholder="you@example.com" autoComplete="email" />
          </Field>
          <Field label="Phone number" hint="Optional" error={errors.phone?.message} icon={<Phone size={16} />}>
            <input type="tel" {...register('phone')} className={inputClass} placeholder="+250 7XX XXX XXX" autoComplete="tel" />
          </Field>
          <Field label="Password" error={errors.password?.message} icon={<Lock size={16} />}>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Use at least 6 characters' } })} className={`${inputClass} pr-11`} placeholder="At least 6 characters" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword?.message} icon={<Lock size={16} />}>
            <input type="password" {...register('confirmPassword', { required: 'Please confirm your password', validate: (value) => value === watch('password') || 'Passwords do not match' })} className={inputClass} placeholder="Repeat your password" autoComplete="new-password" />
          </Field>

          <button type="submit" disabled={isSubmitting || success} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">Already have an account? <Link href="/login" className="font-bold text-orange-600 hover:underline">Sign in</Link></p>
      </div>
    </AuthRegisterLayout>
  );
}

function Field({ label, hint, error, icon, children }: { label: string; hint?: string; error?: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-400">{icon}</span>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
