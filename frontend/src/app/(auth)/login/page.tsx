'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AuthRegisterLayout from '@/components/AuthRegisterLayout';
import { Mail, Lock, Eye, EyeOff, X, AlertTriangle, Loader2, ArrowRight, Megaphone, Handshake, Store, ChevronRight } from '@/lib/icons';

const ORG = '#E85D04';

interface LoginForm { email: string; password: string; }

const ACCOUNT_TYPES = [
  {
    id: 'ambassador',
    title: 'Ambassador',
    description: 'Refer clients and earn commissions on successful property transactions.',
    icon: Megaphone,
    href: '/ambassador/register',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverBorder: 'hover:border-amber-400',
    iconColor: '#D97706',
  },
  {
    id: 'broker',
    title: 'Broker',
    description: 'List properties, connect with buyers, and close deals professionally.',
    icon: Handshake,
    href: '/broker/register',
    gradient: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
    iconColor: '#2563EB',
  },
  {
    id: 'supplier',
    title: 'Supplier',
    description: 'Offer construction materials, services, and supplies to the market.',
    icon: Store,
    href: '/supplier/register',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
    iconColor: '#059669',
  },
];

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();
  const router = useRouter();
  const { refreshUser, user } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const execRedirects: Record<string, string> = {
      CEO: '/executive/ceo',
      CIO: '/executive/cio',
      COO: '/executive/coo',
      CMO: '/executive/cmo',
      CFO: '/executive/cfo',
    };
    const execOverride = user.executive_role ? execRedirects[user.executive_role] : null;
    const roleRedirects: Record<string, string> = {
      admin: '/admin',
      staff: '/admin',
      executive: '/executive',
      broker: '/broker',
      ambassador: '/ambassador',
      supplier: '/supplier',
    };
    router.replace(execOverride || roleRedirects[user.role] || '/');
  }, [user, router]);

  useEffect(() => {
    if (showAccountTypeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAccountTypeModal]);

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const { data: res } = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      if (!res.token) throw new Error(res.message || 'Login failed');

      localStorage.setItem('nmo_token', res.token);
      await refreshUser();
      const execRedirects: Record<string, string> = {
        CEO: '/executive/ceo',
        CIO: '/executive/cio',
        COO: '/executive/coo',
        CMO: '/executive/cmo',
        CFO: '/executive/cfo',
      };
      const resUser = (res as { user?: { role?: string; executive_role?: string } }).user;
      const execOverride = resUser?.executive_role ? execRedirects[resUser.executive_role] : null;
      const roleRedirects: Record<string, string> = {
        admin: '/admin',
        staff: '/admin',
        executive: '/executive',
        broker: '/broker',
        ambassador: '/ambassador',
        supplier: '/supplier',
      };
      router.push(execOverride || roleRedirects[resUser?.role || ''] || '/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as { message?: string })?.message
        || 'Login failed. Please try again.';
      setError(msg);
    }
  };

  return (
    <AuthRegisterLayout badge="Sign In">

      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <img src="/assets/logo.png" alt="E-Nyagasambu" className="w-11 h-11 object-contain" />
        <div>
          <span className="text-gray-900 font-extrabold text-lg tracking-tight block leading-tight">E-Nyagasambu</span>
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: `${ORG}bb` }}>Digital Market Place</span>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1.5">Welcome back</h1>
        <p className="text-sm" style={{ color: 'rgba(0,0,0,0.4)' }}>Sign in to your account</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 text-sm rounded-xl px-4 py-3 mb-6"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
          <X size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold mb-2 tracking-wide" style={{ color: 'rgba(0,0,0,0.5)' }}>
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,0,0,0.25)' }}>
            <Mail size={16} />
            </div>
            <input type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full rounded-xl pl-11 pr-4 py-3 text-sm transition-all duration-200 outline-none"
              style={{
                background: 'rgba(0, 0, 0, 0.03)',
                border: errors.email ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: '#1e293b',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              }}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email.message}</p>}
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(0,0,0,0.5)' }}>PASSWORD</label>
            <Link href="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: ORG }}>Forgot?</Link>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,0,0,0.25)' }}>
            <Lock size={16} />
            </div>
            <input type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required' })}
              onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
              onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
              className="w-full rounded-xl pl-11 pr-11 py-3 text-sm transition-all duration-200 outline-none"
              style={{
                background: 'rgba(0, 0, 0, 0.03)',
                border: errors.password ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: '#1e293b',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              }}
              placeholder="Enter your password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
              style={{ color: 'rgba(0,0,0,0.3)' }}>
              {showPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
          {capsLock && (
            <p className="text-yellow-400 text-[11px] mt-1.5 ml-1 flex items-center gap-1">
              <AlertTriangle size={12} />
              Caps Lock is on
            </p>
          )}
          {errors.password && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <div>
          <button type="submit" disabled={isSubmitting}
            className="w-full font-bold py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide disabled:opacity-50 active:scale-[0.98]"
            style={{
              background: isSubmitting ? `${ORG}88` : `linear-gradient(135deg, ${ORG}, ${ORG}dd)`,
              color: '#fff',
              boxShadow: `0 4px 20px ${ORG}44`,
            }}>
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2.5">
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-7">
        <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
        <span className="text-[11px] font-medium" style={{ color: 'rgba(0,0,0,0.25)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
      </div>

      {/* Create Account Button */}
      <div className="text-center mb-5">
        <button
          onClick={() => setShowAccountTypeModal(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-white hover:shadow-lg active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${ORG}, #c44d00)`,
            boxShadow: `0 4px 15px ${ORG}33`,
          }}>
          Create an Account
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] mt-7" style={{ color: 'rgba(0,0,0,0.25)' }}>
        &copy; {new Date().getFullYear()} E-Nyagasambu Ltd. All rights reserved.
      </p>

      {/* Account Type Selection Modal */}
      {showAccountTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAccountTypeModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4" style={{ background: 'linear-gradient(135deg, #0f1e42, #1a2d5a)' }}>
              <button
                onClick={() => setShowAccountTypeModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Choose Account Type</h2>
              <p className="text-white/60 text-sm">Select how you want to join the platform</p>
            </div>

            {/* Account Type Cards */}
            <div className="p-5 space-y-3">
              {ACCOUNT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Link
                    key={type.id}
                    href={type.href}
                    className={`group flex items-center gap-4 p-4 rounded-xl border-2 ${type.borderColor} ${type.hoverBorder} ${type.bgLight} transition-all duration-200 hover:shadow-md`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-md`}>
                      <Icon size={22} color="#fff" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm">{type.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{type.description}</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-all group-hover:scale-110">
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="px-5 pb-5">
              <p className="text-center text-[11px] text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => setShowAccountTypeModal(false)}
                  className="font-semibold hover:underline"
                  style={{ color: ORG }}
                >
                  Sign in instead
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </AuthRegisterLayout>
  );
}