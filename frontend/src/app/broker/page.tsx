'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import api from '@/lib/api';
import { Package, Store, Car, CheckCircle, Handshake, Users, Clock, CreditCard, Coins, FileText, TrendingUp, User, Award, Mail, Phone, MapPin } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const authorizedServices = [
  { label: 'Product Brokerage', desc: 'Facilitate buying & selling of goods', icon: <Package size={20} /> },
  { label: 'Property Brokerage', desc: 'Connect buyers & sellers of real estate', icon: <Store size={20} /> },
  { label: 'Vehicle Brokerage', desc: 'Arrange deals for cars, bikes & more', icon: <Car size={20} /> },
  { label: 'Marketplace Verification', desc: 'Verify listings & ensure trust', icon: <CheckCircle size={20} /> },
  { label: 'Customer Support', desc: 'Assist clients through transactions', icon: <Handshake size={20} /> },
];

interface BrokerStats {
  totalClients: number;
  clientsThisMonth: number;
  activeListings: number;
  activeThisWeek: number;
  pendingListings: number;
  completedDeals: number;
  dealsThisQuarter: number;
  pendingTransactions: number;
  totalCommission: number;
  commissionThisMonth: number;
}

export default function BrokerDashboardPage() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [cert, setCert] = useState<{ status: string; cert_no?: string; amount_rwf?: number; type_name?: string; type_price?: number } | null>(null);
  const [certLoading, setCertLoading] = useState(true);
  const [statsData, setStatsData] = useState<BrokerStats | null>(null);
  const [report, setReport] = useState<{
    byMonth: { label: string; count: number }[];
    recentClients: { id: number; name: string; created_at: string }[];
    recentLeads: { id: number; buyer_name: string; created_at: string }[];
  } | null>(null);

  useEffect(() => {
    api.get('/broker/certificate').then(({ data }) => {
      setCert(data.certificate || null);
    }).catch(() => {}).finally(() => setCertLoading(false));
  }, []);

  useEffect(() => {
    api.get('/broker/stats').then(({ data }) => {
      setStatsData(data.stats || null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/broker/reports').then(({ data }) => {
      setReport(data || null);
    }).catch(() => {});
  }, []);

  const certPrice = cert?.amount_rwf ?? cert?.type_price ?? 2000;

  const stats = [
    { label: 'Total Clients', value: String(statsData?.totalClients ?? 0), icon: <Users size={24} />, color: NAVY, bg: '#eef2ff', change: `+${statsData?.clientsThisMonth ?? 0} this month` },
    { label: 'Active Listings', value: String(statsData?.activeListings ?? 0), icon: <Store size={24} />, color: '#059669', bg: '#ecfdf5', change: `+${statsData?.activeThisWeek ?? 0} this week` },
    { label: 'Pending Listings', value: String(statsData?.pendingListings ?? 0), icon: <Clock size={24} />, color: '#d97706', bg: '#fffbeb', change: 'Awaiting renewal' },
    { label: 'Completed Deals', value: String(statsData?.completedDeals ?? 0), icon: <CheckCircle size={24} />, color: '#0f1e42', bg: '#f0f2f6', change: `+${statsData?.dealsThisQuarter ?? 0} this quarter` },
    { label: 'Pending Transactions', value: String(statsData?.pendingTransactions ?? 0), icon: <CreditCard size={24} />, color: '#dc2626', bg: '#fef2f2', change: 'Need attention' },
    { label: 'Total Commission', value: format(statsData?.totalCommission ?? 0), icon: <Coins size={24} />, color: ORG, bg: '#fff7ed', change: `+${format(statsData?.commissionThisMonth ?? 0)} this month` },
  ];

  const quickActions = [
    { href: '/broker/clients', icon: <Users size={24} />, label: 'Add Client', desc: 'Register a new client', color: '#eef2ff' },
    { href: '/broker/listings', icon: <Store size={24} />, label: 'New Listing', desc: 'Create a property listing', color: '#ecfdf5' },
    { href: '/broker/leads', icon: <FileText size={24} />, label: 'View Leads', desc: 'Check new inquiries', color: '#fff7ed' },
    { href: '/broker/reports', icon: <TrendingUp size={24} />, label: 'Reports', desc: 'Download performance', color: '#fef2f2' },
  ];

  const relTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Yesterday';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  const recentActivities = [
    ...(report?.recentClients || []).map((c) => ({ action: `New client registered: ${c.name}`, at: c.created_at, time: relTime(c.created_at), icon: <User size={16} /> })),
    ...(report?.recentLeads || []).map((l) => ({ action: `New lead: ${l.buyer_name}`, at: l.created_at, time: relTime(l.created_at), icon: <FileText size={16} /> })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6);

  const monthMax = Math.max(1, ...(report?.byMonth || []).map((m) => m.count));

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Hero Welcome Section */}
      <div className="bg-gradient-to-r from-[#0f1e42] to-[#1a2952] text-white px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">Welcome, {user?.name?.split(' ')[0]}</h1>
              <p className="text-blue-100">Manage your properties, clients, and earnings all in one place</p>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                <p className="text-xs text-blue-100 mb-1">Certificate Status</p>
                <p className="text-lg font-bold flex items-center gap-2">
                  {cert?.status === 'generated' ? (
                    <><span className="w-2 h-2 rounded-full bg-green-400"></span>Active</>
                  ) : (
                    <><span className="w-2 h-2 rounded-full bg-yellow-400"></span>Pending</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Certificate Alert Banner */}
          {cert ? (
            cert.status !== 'generated' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-600 font-bold">!</span>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">Complete Your Certificate</p>
                    <p className="text-sm text-amber-700">Finish payment to get verified and access all features</p>
                  </div>
                </div>
                <Link href="/broker/certificate" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition shrink-0">
                  Complete Now
                </Link>
              </div>
            )
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Award size={20} style={{ color: '#0f1e42' }} />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Get Your Broker Certificate</p>
                  <p className="text-sm text-blue-700">Become a verified broker and unlock premium features</p>
                </div>
              </div>
              <Link href="/broker/certificate" className="px-4 py-2 bg-[#0f1e42] hover:bg-[#0a1530] text-white rounded-lg font-semibold text-sm transition shrink-0">
                Get Certified ({format(certPrice)})
              </Link>
            </div>
          )}

          {/* Top Stats Row - Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Listings */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Active Listings</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{statsData?.activeListings ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Store size={24} className="text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500">+{statsData?.activeThisWeek ?? 0} this week</p>
            </div>

            {/* Total Clients */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Clients</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{statsData?.totalClients ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users size={24} className="text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500">+{statsData?.clientsThisMonth ?? 0} this month</p>
            </div>

            {/* Completed Deals */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Completed Deals</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{statsData?.completedDeals ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <CheckCircle size={24} className="text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500">+{statsData?.dealsThisQuarter ?? 0} this quarter</p>
            </div>

            {/* Total Commission */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Earnings</p>
                  <p className="text-2xl font-extrabold" style={{ color: ORG }} >{format(statsData?.totalCommission ?? 0)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg" style={{ background: `${ORG}15` }}>
                  <Coins size={24} style={{ color: ORG }} className="w-full h-full p-2" />
                </div>
              </div>
              <p className="text-xs text-gray-500">+{format(statsData?.commissionThisMonth ?? 0)} this month</p>
            </div>
          </div>

          {/* Action Grid - Primary Features */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Quick Actions - Left Column */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((qa) => (
                  <Link key={qa.href} href={qa.href}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition group">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: qa.color }}>
                      {qa.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-[#E85D04] transition text-sm">{qa.label}</p>
                      <p className="text-xs text-gray-500">{qa.desc}</p>
                    </div>
                    <span className="text-gray-300 group-hover:text-[#E85D04] transition">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Performance Chart - Middle Column */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Listing Activity (Last 6 Months)</h2>
              <div className="flex items-end gap-2 h-40">
                {(report?.byMonth || []).slice(0, 6).map((bar) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">{bar.count}</span>
                    <div className="w-full rounded-md transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${Math.max(8, Math.round((bar.count / monthMax) * 100))}%`,
                        background: `linear-gradient(to top, ${NAVY}, ${ORG})`,
                        minHeight: 8
                      }} />
                    <span className="text-[10px] text-gray-500 text-center">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity - Right Column */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex gap-3 pb-3 last:pb-0 border-b border-gray-100 last:border-b-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f0f2f9' }}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{a.action}</p>
                      <p className="text-xs text-gray-400 mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section - Services & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Authorized Services */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Your Authorized Services</h2>
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${ORG}15`, color: ORG }}>Certified</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {authorizedServices.map((s) => (
                  <div key={s.label} className="p-4 border border-gray-100 rounded-lg hover:border-[#E85D04] hover:shadow-md transition group text-center">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 transition" style={{ background: `${NAVY}08` }}>
                      {s.icon}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Items Alert */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Attention Needed</h2>
              <div className="space-y-3">
                {statsData?.pendingListings !== undefined && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-semibold text-amber-900">{statsData.pendingListings}</p>
                    <p className="text-xs text-amber-700">Pending Listings</p>
                  </div>
                )}
                {statsData?.pendingTransactions !== undefined && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-900">{statsData.pendingTransactions}</p>
                    <p className="text-xs text-red-700">Pending Transactions</p>
                  </div>
                )}
                <Link href="/broker/transactions" className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center text-sm font-semibold text-[#E85D04] transition">
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
