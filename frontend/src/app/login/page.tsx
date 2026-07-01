'use client';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface LoginForm { email: string; password: string; }

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();
  const { login } = useAuth();
  const { T } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState('');

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #1a2b6d11 0%, #FF6B0011 100%)' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

        {/* Logo mark */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-base"
            style={{ background: '#1a2b6d' }}>E</div>
          <div>
            <p className="font-extrabold text-sm leading-tight" style={{ color: '#1a2b6d' }}>
              <span style={{ color: '#FF6B00' }}>E-</span>Nyagasambu
            </p>
            <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#FF6B00' }}>Digital Market Place</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a2b6d' }}>{T.welcomeBack}</h1>
        <p className="text-gray-500 text-sm mb-6">{T.signInAccount}</p>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{T.email}</label>
            <input type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{T.password}</label>
            <input type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full text-white font-bold py-2.5 rounded-lg transition disabled:opacity-60"
            style={{ background: '#1a2b6d' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FF6B00')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a2b6d')}
          >
            {isSubmitting ? T.signingIn : T.signIn}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {T.noAccount}{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: '#FF6B00' }}>{T.createOneFree}</Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          <Link href="/admin/login" className="hover:underline" style={{ color: '#FF6B00' }}>Admin Login →</Link>
        </p>
      </div>
    </div>
  );
}
