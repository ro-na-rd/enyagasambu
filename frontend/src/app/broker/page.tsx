'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const authorizedServices = [
  { label: 'Product Brokerage', desc: 'Facilitate buying & selling of goods', icon: '📦' },
  { label: 'Property Brokerage', desc: 'Connect buyers & sellers of real estate', icon: '🏠' },
  { label: 'Vehicle Brokerage', desc: 'Arrange deals for cars, bikes & more', icon: '🚗' },
  { label: 'Marketplace Verification', desc: 'Verify listings & ensure trust', icon: '✅' },
  { label: 'Customer Support', desc: 'Assist clients through transactions', icon: '🤝' },
];

export default function BrokerDashboardPage() {
  const { user } = useAuth();
  const [cert, setCert] = useState<{ status: string; cert_no?: string; amount_rwf?: number } | null>(null);
  const [certLoading, setCertLoading] = useState(true);

  useEffect(() => {
    api.get('/broker/certificate').then(({ data }) => {
      setCert(data.certificate || null);
    }).catch(() => {}).finally(() => setCertLoading(false));
  }, []);

  const stats = [
    { label: 'Total Clients', value: '24', icon: '👥', color: NAVY, bg: '#eef2ff', change: '+3 this month' },
    { label: 'Active Listings', value: '12', icon: '🏠', color: '#059669', bg: '#ecfdf5', change: '+2 this week' },
    { label: 'Pending Listings', value: '5', icon: '⏳', color: '#d97706', bg: '#fffbeb', change: 'Awaiting approval' },
    { label: 'Completed Deals', value: '18', icon: '✅', color: '#0f1e42', bg: '#f0f2f6', change: 'This quarter' },
    { label: 'Pending Transactions', value: '7', icon: '💳', color: '#dc2626', bg: '#fef2f2', change: 'Need attention' },
    { label: 'Total Commission', value: 'RWF 2,450', icon: '💰', color: ORG, bg: '#fff7ed', change: '+RWF 320 this month' },
  ];

  const quickActions = [
    { href: '/broker/clients', icon: '👥', label: 'Add Client', desc: 'Register a new client', color: '#eef2ff' },
    { href: '/broker/listings', icon: '🏠', label: 'New Listing', desc: 'Create a property listing', color: '#ecfdf5' },
    { href: '/broker/leads', icon: '📋', label: 'View Leads', desc: 'Check new inquiries', color: '#fff7ed' },
    { href: '/broker/reports', icon: '📈', label: 'Reports', desc: 'Download performance', color: '#fef2f2' },
  ];

  const recentActivities = [
    { action: 'New client registered: Jean-Pierre Kagame', time: '2 hours ago', icon: '👤' },
    { action: 'Property listing approved: 3-Bedroom in Kacyiru', time: '5 hours ago', icon: '✅' },
    { action: 'Commission credited: RWF 150 from sale #1024', time: 'Yesterday', icon: '💰' },
    { action: 'New lead from website: Kigali Office Space', time: 'Yesterday', icon: '📋' },
    { action: 'Deal closed: Toyota Hilux 2020 - Kigali', time: '2 days ago', icon: '🎉' },
  ];

  return (
    <div className="p-4 lg:p-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Broker Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, <strong>{user?.name}</strong> — here&apos;s your business overview.</p>
      </div>

      {/* Certificate Status */}
      <div className="mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0f1e42] to-[#E85D04] flex items-center justify-center text-2xl shrink-0">📜</div>
            <div>
              <p className="text-sm font-bold text-gray-800">Broker Certificate</p>
              {certLoading ? (
                <p className="text-xs text-gray-400 mt-1">Loading...</p>
              ) : cert ? (
                <>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Status: <span className={`font-semibold ${cert.status === 'active' || cert.status === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>{cert.status}</span>
                    {cert.cert_no && <span className="ml-2">No: {cert.cert_no}</span>}
                  </p>
                  {cert.status !== 'active' && cert.status !== 'approved' && (
                    <Link href="/broker/certificate" className="text-xs font-semibold text-[#E85D04] hover:underline mt-1 inline-block">Complete Payment →</Link>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mt-0.5">Not yet purchased. Get certified to unlock all brokerage services.</p>
                  <Link href="/broker/certificate" className="text-xs font-semibold text-[#E85D04] hover:underline mt-1 inline-block">Pay Now (RWF 25,000) →</Link>
                </>
              )}
            </div>
          </div>
          {cert?.status === 'active' || cert?.status === 'approved' ? (
            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">Active ✓</span>
          ) : (
            <Link href="/broker/certificate" className="text-xs font-medium text-white bg-gradient-to-r from-[#0f1e42] to-[#E85D04] px-4 py-2 rounded-lg hover:opacity-90 transition">Pay Now</Link>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{s.label}</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Authorized Services / Broker Roles */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">My Authorized Services</h2>
          <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">Certified Broker</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {authorizedServices.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg mx-auto mb-2 transition"
                style={{ background: `linear-gradient(135deg, ${NAVY}15, ${ORG}15)` }}>
                {s.icon}
              </div>
              <p className="text-xs font-bold text-gray-800 group-hover:text-[#E85D04] transition">{s.label}</p>
              <p className="text-[9px] text-gray-400 mt-1 leading-tight">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions + Recent activities */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Quick actions */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Quick Actions</h2>
          {quickActions.map((qa) => (
            <Link key={qa.href} href={qa.href}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: qa.color }}>{qa.icon}</div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#E85D04] transition">{qa.label}</p>
                <p className="text-xs text-gray-400">{qa.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Monthly Performance */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Monthly Performance</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-end gap-2 h-32 mb-2">
              {[
                { label: 'Jan', value: 65 }, { label: 'Feb', value: 45 }, { label: 'Mar', value: 80 },
                { label: 'Apr', value: 55 }, { label: 'May', value: 90 }, { label: 'Jun', value: 70 },
              ].map((bar) => (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-gray-600">{bar.value}%</span>
                  <div className="w-full rounded-md transition-all" style={{ height: `${bar.value}%`, background: `linear-gradient(to top, ${NAVY}, ${ORG})`, minHeight: 4 }} />
                  <span className="text-[9px] text-gray-400">{bar.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">6-month performance trend</p>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Recent Activities</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="space-y-4">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: '#f0f2f9' }}>{a.icon}</div>
                    {i < recentActivities.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{a.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
