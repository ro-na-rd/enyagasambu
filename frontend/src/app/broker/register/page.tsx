'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import api from '@/lib/api';

interface BrokerRegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}

export default function BrokerRegisterPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<BrokerRegisterForm>();
  const router = useRouter();
  const [error, setError] = useState('');

  const onSubmit = async (data: BrokerRegisterForm) => {
    setError('');
    try {
      const { data: res } = await api.post('/auth/broker/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      localStorage.setItem('nmo_token', res.token);
      window.location.href = '/broker/register/photo';
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #0f1e4211 0%, #E85D0411 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-base"
            style={{ background: 'linear-gradient(135deg, #0f1e42, #E85D04)' }}>E</div>
          <div>
            <p className="font-extrabold text-sm leading-tight" style={{ color: '#0f1e42' }}>
              Broker Portal
            </p>
            <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#E85D04' }}>E-Nyagasambu</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f1e42' }}>Register as Broker</h1>
        <p className="text-gray-500 text-sm mb-6">Create your broker account to start managing properties and clients.</p>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input {...register('name', { required: 'Name is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              placeholder="Jean-Paul Habimana" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" {...register('email', { required: 'Email is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              placeholder="broker@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
            <input {...register('phone', { required: 'Phone is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              placeholder="+250 7XX XXX XXX" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" {...register('password', { required: 'Password required', minLength: { value: 6, message: 'At least 6 characters' } })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
            <input type="password" {...register('confirm', { required: 'Please confirm', validate: (v) => v === watch('password') || 'Passwords do not match' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              placeholder="••••••••" />
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full text-white font-bold py-2.5 rounded-lg transition disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0f1e42, #E85D04)' }}>
            {isSubmitting ? 'Creating Account...' : 'Register as Broker'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/broker/login" className="font-semibold hover:underline" style={{ color: '#E85D04' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
