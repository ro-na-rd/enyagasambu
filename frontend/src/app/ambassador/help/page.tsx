'use client';
import { ChevronRight, BookOpen, FileText, Lock, ExternalLink } from '@/lib/icons';
import Link from 'next/link';

const faqs = [
  { q: 'What is the Ambassador Program?', a: 'The Ambassador Program rewards you for referring new ambassadors to E-Nyagasambu. You earn 200 RWF when a referred ambassador pays for their certificate.' },
  { q: 'How do I refer someone?', a: 'Share your unique referral code or referral link with other ambassadors. When they register and pay for their certificate, you earn a reward.' },
  { q: 'How many RWF do I earn per referral?', a: 'You earn 200 RWF for each ambassador you refer who pays for their certificate. The reward is credited to your coins balance.' },
  { q: 'Where can I see my referrals?', a: 'Go to the My Referrals page in your Ambassador Dashboard to track all your referrals and earnings.' },
  { q: 'How do I use my coins?', a: 'Coins can be used to post listings, boost your ads, and access premium features on the platform.' },
  { q: 'How do I recruit suppliers?', a: 'Use the Recruitments page to track suppliers and vendors you bring to the platform. Add their details and update their status as you onboard them.' },
  { q: 'What are awareness campaigns?', a: 'Campaigns help you organize promotional activities in your community. Create a campaign, track actions, and measure your impact.' },
  { q: 'Where can I find promotional materials?', a: 'Visit the Promotions page for pre-written messages, social media content, and shareable links you can use to promote E-Nyagasambu.' },
];

export default function AmbassadorHelpPage() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-sm text-gray-500 mt-1">Frequently asked questions and support resources</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <details key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm group">
              <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-800 list-none flex items-center justify-between">
                {item.q}
                <span className="text-gray-400 group-open:rotate-90 transition-transform"><ChevronRight size={16} /></span>
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-50 pt-3">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Contact Support</h2>
            <p className="text-sm text-gray-600 mb-4">Need help? Reach out to our support team.</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> support@enyagasambu.rw</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Phone:</span> +250 788 123 456</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Hours:</span> Mon-Fri, 8:00 AM - 5:00 PM</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Quick Links</h2>
            <div className="space-y-2">
              <Link href="/ambassador/policies"
                className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 transition flex items-center gap-2">
                <BookOpen size={16} /> Ambassador Guide & Policies
              </Link>
              <Link href="/content/terms"
                className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 transition flex items-center gap-2">
                <FileText size={16} /> Terms & Conditions <ExternalLink size={12} />
              </Link>
              <Link href="/content/privacy"
                className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 transition flex items-center gap-2">
                <Lock size={16} /> Privacy Policy <ExternalLink size={12} />
              </Link>
              <Link href="/ambassador/onboarding"
                className="w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 transition flex items-center gap-2">
                <BookOpen size={16} /> Onboarding Checklist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
