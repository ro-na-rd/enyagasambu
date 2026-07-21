'use client';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  referral_code: string;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultRef = searchParams.get('ref') || '';
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    defaultValues: { referral_code: defaultRef },
  });
  const { login } = useAuth();
  const { T } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState('');

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      const { data: res } = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        referral_code: data.referral_code || undefined,
      });
      localStorage.setItem('nmo_token', res.token);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{T.createAccount}</h1>
      <p className="text-gray-500 text-sm mb-2">
        {T.createAccountSub}
        {defaultRef && <span className="text-yellow-600"> + referral bonus!</span>}
      </p>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.fullName}</label>
          <input {...register('name', { required: 'Name is required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none " placeholder="Jean-Paul Habimana" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.email}</label>
          <input type="email" {...register('email', { required: 'Email is required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none " placeholder="you@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.phone}</label>
          <input {...register('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none " placeholder="+250 7XX XXX XXX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.password}</label>
          <input type="password" {...register('password', { required: 'Password required', minLength: { value: 6, message: 'At least 6 characters' } })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none " placeholder="••••••••" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.confirmPassword}</label>
          <input type="password" {...register('confirm', { required: 'Please confirm', validate: (v) => v === watch('password') || 'Passwords do not match' })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none " placeholder="••••••••" />
          {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{T.referralCode}</label>
          <input {...register('referral_code')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none  uppercase" placeholder="e.g. AB12CD" />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-[#FF6B00] text-white font-semibold py-2.5 rounded-lg hover:bg-[#e05d00] transition disabled:opacity-60">
          {isSubmitting ? T.creatingAccount : T.createAccountBtn}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        {T.alreadyHaveAccount}{' '}
        <Link href="/login" className="text-[#FF6B00] font-medium hover:underline">{T.signIn}</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
