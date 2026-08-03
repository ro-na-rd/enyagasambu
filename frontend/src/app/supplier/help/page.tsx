'use client';
import Link from 'next/link';
import { HelpCircle, MessageCircle, BookOpen } from '@/lib/icons';

const ORG = '#E85D04';
const NAVY = '#0f1e42';

export default function SupplierHelpPage() {
  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
          <HelpCircle size={18} style={{ color: ORG }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-sm text-gray-500 mt-0.5">Get assistance with your supplier account</p>
        </div>
      </div>

      <div className="space-y-4">
        <Link href="/support" className="block rounded-2xl p-5 hover:shadow-lg transition flex items-center gap-4" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${ORG}15` }}>
            <MessageCircle size={20} style={{ color: ORG }} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Contact Support</p>
            <p className="text-xs text-gray-500 mt-0.5">Submit a request to our support team for payment, listing or account issues.</p>
          </div>
        </Link>

        <Link href="/guide" className="block rounded-2xl p-5 hover:shadow-lg transition flex items-center gap-4" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${NAVY}15` }}>
            <BookOpen size={20} style={{ color: NAVY }} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Platform Guide</p>
            <p className="text-xs text-gray-500 mt-0.5">Learn how to post listings, manage your business and reach buyers.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
