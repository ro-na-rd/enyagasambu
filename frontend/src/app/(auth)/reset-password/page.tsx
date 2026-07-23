'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Lock, Eye, EyeOff, X, CheckCircle, Loader2, AlertTriangle } from '@/lib/icons';

interface ResetForm { token: string; password: string; confirmPassword: string; }

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function ResetPasswordPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ResetForm>();
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const onSubmit = async (data: ResetForm) => {
    setError('');
    setSuccess('');
    try {
      const { data: res } = await api.post('/auth/reset-password', {
        token: data.token,
        password: data.password,
      });
      setSuccess(res.message);
      localStorage.removeItem('nmo_reset_token');
      localStorage.removeItem('nmo_reset_email');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as { message?: string })?.message
        || 'Failed to reset password. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: '#f8fafc' }}>
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${NAVY}, transparent 70%)`, animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${ORG}, transparent 70%)`, animation: 'float 10s ease-in-out infinite reverse' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-5"
          style={{ background: `radial-gradient(circle, #7c3aed, transparent 70%)`, animation: 'float 12s ease-in-out infinite' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${ORG}66, transparent)` }} />
      </div>

      <div className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
        <div className="h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${NAVY}, ${ORG})` }} />

        <div className="rounded-b-2xl p-8 sm:p-10"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(0, 0, 0, 0.05)',
          }}>

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ORG}, ${ORG}cc)`, boxShadow: `0 4px 20px ${ORG}44` }}>
              <span className="text-gray-900 font-black text-lg">E</span>
            </div>
            <div>
              <span className="text-gray-900 font-extrabold text-lg tracking-tight block leading-tight">E-Nyagasambu</span>
              <span className="text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: `${ORG}bb` }}>Digital Market Place</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1.5">Reset password</h1>
            <p className="text-sm" style={{ color: 'rgba(0,0,0,0.4)' }}>Enter your reset code and a new password</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 text-sm rounded-xl px-4 py-3 mb-6"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
              <X size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <CheckCircle size={28} style={{ color: '#22c55e' }} />
                </div>
              </div>
              <p className="text-gray-900 text-sm font-medium mb-2">{success}</p>
              <p className="text-xs" style={{ color: 'rgba(0,0,0,0.4)' }}>Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wide" style={{ color: 'rgba(0,0,0,0.5)' }}>
                  RESET CODE
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,0,0,0.25)' }}>
                    <Lock size={16} />
                  </div>
                  <input type="text"
                    {...register('token', { required: 'Reset code is required' })}
                    className="w-full rounded-xl pl-11 pr-4 py-3 text-sm transition-all duration-200 outline-none font-mono tracking-wider"
                    style={{
background: 'rgba(0, 0, 0, 0.03)',
                      border: errors.token ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: '#1e293b',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    placeholder="Paste your reset code"
                  />
                </div>
                {errors.token && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.token.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wide" style={{ color: 'rgba(0,0,0,0.5)' }}>
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,0,0,0.25)' }}>
                    <Lock size={16} />
                  </div>
                  <input type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'At least 6 characters' },
                    })}
                    onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                    onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                    className="w-full rounded-xl pl-11 pr-11 py-3 text-sm transition-all duration-200 outline-none"
                    style={{
                      background: 'rgba(0, 0, 0, 0.03)',
                      border: errors.password ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: '#1e293b',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    placeholder="New password (min 6 chars)"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                    style={{ color: 'rgba(0,0,0,0.3)' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wide" style={{ color: 'rgba(0,0,0,0.5)' }}>
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,0,0,0.25)' }}>
                    <Lock size={16} />
                  </div>
                  <input type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (v) => v === watch('password') || 'Passwords do not match',
                    })}
                    className="w-full rounded-xl pl-11 pr-4 py-3 text-sm transition-all duration-200 outline-none"
                    style={{
                      background: 'rgba(0, 0, 0, 0.03)',
                      border: errors.confirmPassword ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: '#1e293b',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    placeholder="Re-enter new password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.confirmPassword.message}</p>}
              </div>

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
                    Resetting...
                  </span>
                ) : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'rgba(0,0,0,0.25)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
          </div>

          <Link href="/login"
            className="block w-full text-center font-bold py-3 rounded-xl text-sm transition-all duration-200 hover:bg-gray-100 active:scale-[0.98]"
            style={{
              border: '1px solid rgba(0,0,0,0.1)',
              color: 'rgba(0,0,0,0.7)',
            }}>
            Back to Sign In
          </Link>

          <p className="text-center text-[10px] mt-7" style={{ color: 'rgba(0,0,0,0.25)' }}>
            &copy; {new Date().getFullYear()} E-Nyagasambu Ltd. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
}
