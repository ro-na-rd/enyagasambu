'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import { LayoutDashboard, Store, Home, BadgeCheck, Loader2, ArrowUpRight, Mail, Phone, MapPin } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface SupplierProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  business_name: string | null;
  business_location: string | null;
  verified: number | boolean;
  created_at: string;
}

interface MyListing {
  id: number;
  title: string;
  status: string;
  price: number | null;
  currency: string;
  expires_at: string | null;
  created_at: string;
}

export default function SupplierDashboard() {
  const { format } = useCurrency();
  const { user } = useAuth();
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: p }, { data: l }] = await Promise.all([
        api.get('/auth/supplier/me'),
        api.get('/suppliers/me/listings'),
      ]);
      setProfile(p.user);
      setListings(l.listings);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading dashboard...
      </div>
    );
  }

  const verified = profile?.verified === 1 || profile?.verified === true;
  const activeCount = listings.filter((l) => l.status === 'active').length;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
          <LayoutDashboard size={22} style={{ color: ORG }} /> Welcome, {profile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Supplier'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your supply business on E-Nyagasambu</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-5" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* User Profile Card */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0f1e42] to-[#1a2952] flex items-center justify-center text-white font-bold text-2xl">
                {profile?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile?.name || user?.name || 'Supplier'}</h2>
                <p className="text-gray-500 mt-1">Supplier • {profile?.email || user?.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {profile?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} style={{ color: ORG }} />
                  <span>{profile.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail size={16} style={{ color: ORG }} />
                <span>{profile?.email || user?.email}</span>
              </div>
              {profile?.business_location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} style={{ color: ORG }} />
                  <span>{profile.business_location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verification banner */}
      {!verified && (
        <div className="rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-3"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
              <BadgeCheck size={20} style={{ color: ORG }} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Account pending verification</p>
              <p className="text-xs text-gray-500">Once verified, your business will appear in the public supplier directory.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">My Listings</p>
            <Store size={18} style={{ color: ORG }} />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{listings.length}</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Listings</p>
            <Home size={18} style={{ color: NAVY }} />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{activeCount}</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Verification</p>
            <BadgeCheck size={18} style={{ color: verified ? '#059669' : '#d97706' }} />
          </div>
          <p className={`text-3xl font-extrabold mt-2 ${verified ? 'text-green-600' : 'text-amber-600'}`}>{verified ? 'Verified' : 'Pending'}</p>
        </div>
      </div>

      {/* Recent listings */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">My Recent Listings</h2>
          <Link href="/supplier/listings" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: ORG }}>
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {listings.length === 0 ? (
          <div className="py-16 text-center">
            <Store size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-1">You have not posted any listings yet.</p>
            <p className="text-xs text-gray-400 mb-5">Post your products and services to reach buyers across Rwanda.</p>
            <Link href="/listings/create"
              className="inline-block text-white text-sm font-bold px-6 py-2.5 rounded-xl transition hover:opacity-90"
              style={{ background: ORG }}>
              Create a Listing
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {listings.slice(0, 5).map((l) => (
              <Link key={l.id} href={`/listings/${l.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{l.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Posted {new Date(l.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {l.price != null && <span className="text-sm font-bold" style={{ color: ORG }}>{format(Number(l.price))}</span>}
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full capitalize"
                    style={{ background: l.status === 'active' ? '#dcfce7' : '#f3f4f6', color: l.status === 'active' ? '#059669' : '#6b7280' }}>
                    {l.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
