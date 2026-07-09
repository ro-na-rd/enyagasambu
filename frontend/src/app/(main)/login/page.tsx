'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const NAVY = '#1B2A5E';
const ORG = '#E85D04';

interface LoginForm { email: string; password: string; }

const roleOptions = [
  { value: 'user',       label: '👤  Buyer / Seller',  desc: 'Marketplace access' },
  { value: 'broker',     label: '🤝  Broker',          desc: 'Broker portal' },
  { value: 'ambassador', label: '🏅  Ambassador',       desc: 'Ambassador program' },
  { value: 'admin',      label: '🛡️  Admin / Staff',    desc: 'Platform management' },
];

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const endpoints: Record<string, string> = {
    user: '/auth/login',
    broker: '/auth/broker/login',
    ambassador: '/auth/ambassador/login',
    admin: '/admin/auth/login',
  };

  const redirects: Record<string, string> = {
    user: '/dashboard',
    broker: '/broker',
    ambassador: '/ambassador',
    admin: '/admin',
  };

  const onSubmit = async (data: LoginForm) => {
    if (!selectedRole) return setError('Please select your role');
    setError('');
    try {
      const { data: res } = await api.post(endpoints[selectedRole], {
        email: data.email,
        password: data.password,
      });

      if (!res.token) throw new Error(res.message || 'Login failed');

      localStorage.setItem('nmo_token', res.token);
      await refreshUser();
      router.push(redirects[selectedRole]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as { message?: string })?.message
        || 'Login failed. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: `linear-gradient(135deg, ${NAVY} 60%, ${ORG} 100%)` }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-3"
            style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>E</div>
          <h1 className="text-xl font-extrabold" style={{ color: NAVY }}>E-Nyagasambu</h1>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: ORG }}>Digital Market Place</p>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Welcome Back</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account to continue.</p>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.filter(r => r.value).map((r) => (
                <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition ${
                    selectedRole === r.value
                      ? 'border-[#E85D04] bg-orange-50 ring-1 ring-[#E85D04]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  <span className="block font-medium text-gray-800">{r.label.split(' ').slice(1).join(' ')}</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E85D04]/20 focus:border-[#E85D04]"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting || !selectedRole}
            className="w-full text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50 hover:opacity-90"
            style={{ background: ORG }}
          >
            {isSubmitting ? 'Signing in...' : `Sign In as ${selectedRole ? roleOptions.find(r => r.value === selectedRole)?.label.split(' ').slice(1).join(' ') || '' : '...'}`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: ORG }}>Create one free</Link>
        </p>
        <div className="mt-4 pt-4 border-t border-gray-100 text-center space-x-3">
          <Link href="/ambassador/register" className="text-xs text-gray-400 hover:text-[#E85D04] transition">Register as Ambassador</Link>
          <span className="text-gray-200">|</span>
          <Link href="/broker/register" className="text-xs text-gray-400 hover:text-[#E85D04] transition">Register as Broker</Link>
        </div>
      </div>
    </div>
  );
}
