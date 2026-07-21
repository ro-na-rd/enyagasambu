'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, X, AlertTriangle, Loader2 } from '@/lib/icons';

interface LoginForm { email: string; password: string; }

const NAVY = '#1B2A5E';
const ORG = '#E85D04';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();
  const router = useRouter();
  const { refreshUser, user, login: authLogin } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (user) router.replace(getRedirectPath(user.role)); }, [user, router]);

  function getRedirectPath(role: string) {
    if (role === 'admin' || role === 'moderator' || role === 'staff') return '/admin';
    if (role === 'broker') return '/broker';
    if (role === 'ambassador') return '/ambassador';
    return '/dashboard';
  }

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
      router.push(getRedirectPath(res.user?.role || 'user'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as { message?: string })?.message
        || 'Login failed. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: '#0a0e27' }}>

      {/* ── Animated gradient background ── */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: `radial-gradient(circle, ${NAVY}, transparent 70%)`, animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${ORG}, transparent 70%)`, animation: 'float 10s ease-in-out infinite reverse' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, #7c3aed, transparent 70%)`, animation: 'float 12s ease-in-out infinite' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        {/* Glow line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${ORG}66, transparent)` }} />
      </div>

      {/* ── Login card ── */}
      <div className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>

        {/* Top accent bar */}
        <div className="h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${NAVY}, ${ORG})` }} />

        <div className="rounded-b-2xl p-8 sm:p-10"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}>

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ORG}, ${ORG}cc)`, boxShadow: `0 4px 20px ${ORG}44` }}>
              <span className="text-white font-black text-lg">E</span>
            </div>
            <div>
              <span className="text-white font-extrabold text-lg tracking-tight block leading-tight">E-Nyagasambu</span>
              <span className="text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: `${ORG}bb` }}>Digital Market Place</span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-white mb-1.5">Welcome back</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in to your account</p>
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
              <label className="block text-xs font-semibold mb-2 tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <Mail size={16} />
                </div>
                <input type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="w-full rounded-xl pl-11 pr-4 py-3 text-sm transition-all duration-200 outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: errors.email ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                  }}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>PASSWORD</label>
                <Link href="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: ORG }}>Forgot?</Link>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <Lock size={16} />
                </div>
                <input type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                  onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                  className="w-full rounded-xl pl-11 pr-11 py-3 text-sm transition-all duration-200 outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: errors.password ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                  }}
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
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
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Register */}
          <Link href="/register"
            className="block w-full text-center font-bold py-3 rounded-xl text-sm transition-all duration-200 hover:bg-white/[0.07] active:scale-[0.98]"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}>
            Create an Account
          </Link>

          {/* Quick links */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link href="/ambassador/register" className="text-[11px] font-medium hover:underline transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}>Ambassador</Link>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
            <Link href="/broker/register" className="text-[11px] font-medium hover:underline transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}>Broker</Link>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] mt-7" style={{ color: 'rgba(255,255,255,0.15)' }}>
            &copy; {new Date().getFullYear()} E-Nyagasambu Ltd. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
}
