'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Shield, CheckCircle, AlertTriangle, BookOpen, FileText } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface PolicySection {
  heading: string;
  content?: string;
  items?: string[];
}

interface Policy {
  id: number;
  title: string;
  description: string;
  content: string;
  version: string;
  sections: PolicySection[];
}



export default function AmbassadorPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedPolicies, setAcknowledgedPolicies] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([
      api.get('/ambassador/policies'),
      api.get('/ambassador/policies/status'),
    ])
      .then(([policiesRes, statusRes]) => {
        setPolicies(policiesRes.data.policies);
        const acknowledged = statusRes.data.policies
          .filter((p: any) => p.acknowledged)
          .map((p: any) => p.id);
        setAcknowledgedPolicies(new Set(acknowledged));
      })
      .finally(() => setLoading(false));
  }, []);

  const acknowledgePolicy = async (policyId: number) => {
    try {
      await api.post(`/ambassador/policies/${policyId}/acknowledge`);
      setAcknowledgedPolicies(new Set([...acknowledgedPolicies, policyId]));
    } catch (error) {
      console.error('Failed to acknowledge policy:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Policies & Code of Conduct</h1>
        <p className="text-sm text-gray-500 mt-1">Understand your responsibilities as an E-Nyagasambu Ambassador</p>
      </div>

      <div className="bg-gradient-to-r from-[#0f1e42] to-[#1a2d5a] rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Shield size={28} />
          <h2 className="text-lg font-bold">Ambassador Oath</h2>
        </div>
        <p className="text-sm text-blue-100 leading-relaxed">
          As a certified E-Nyagasambu Ambassador, I pledge to uphold the highest standards of professionalism,
          integrity, and ethical conduct. I will faithfully represent the platform, support fellow users,
          and contribute positively to the E-Nyagasambu community.
        </p>
      </div>

      <div className="space-y-6">
        {policies.map((policy) => (
          <div key={policy.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span style={{ color: NAVY }}><Shield size={20} /></span>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">{policy.title}</h3>
                  <p className="text-xs text-gray-400">Version {policy.version}</p>
                </div>
              </div>
              {!acknowledgedPolicies.has(policy.id) && (
                <button
                  onClick={() => acknowledgePolicy(policy.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                >
                  Acknowledge
                </button>
              )}
              {acknowledgedPolicies.has(policy.id) && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-600 flex items-center gap-1">
                  <CheckCircle size={12} /> Acknowledged
                </span>
              )}
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{policy.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 rounded-xl p-6 text-center">
        <FileText size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500">
          These policies are effective as of the date of your ambassador certification.
          Updates will be communicated via the Announcements page.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          For questions about these policies, contact support@enyagasambu.rw
        </p>
      </div>
    </div>
  );
}
