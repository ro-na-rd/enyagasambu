'use client';
import { useState } from 'react';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const faqs = [
  { q: 'How do I add a new client?', a: 'Go to My Clients and click the "Add Client" button. Fill in their details and save. The client will be added to your portfolio.' },
  { q: 'How are commissions calculated?', a: 'Commissions are calculated as a percentage of the final deal value. The exact percentage depends on your broker agreement.' },
  { q: 'Can I list properties for multiple clients?', a: 'Yes, you can create listings for any of your clients. Each listing will be associated with the respective client.' },
  { q: 'How do I generate reports?', a: 'Navigate to the Reports section where you can download pre-generated reports or create custom reports by selecting date ranges and report types.' },
  { q: 'What should I do if a deal falls through?', a: 'Update the transaction status in the Transactions page. You can also add notes about what happened for future reference.' },
];

export default function BrokerHelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Help & Support</h1>
      <p className="text-sm text-gray-500 mb-6">Find answers to common questions or contact support.</p>

      <div className="space-y-2 mb-8">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-800">{faq.q}</span>
              <span className={`text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {open === i && (
              <div className="px-5 pb-4">
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
        <h2 className="font-semibold text-gray-800 text-sm mb-2">Still need help?</h2>
        <p className="text-xs text-gray-500 mb-4">Our support team is available Mon-Fri, 8AM-6PM</p>
        <div className="flex justify-center gap-3">
          <a href="mailto:support@enyagasambu.rw" className="text-xs font-semibold px-5 py-2.5 rounded-lg text-white transition hover:opacity-90" style={{ background: NAVY }}>
            Email Support
          </a>
          <a href="tel:+250788300003" className="text-xs font-semibold px-5 py-2.5 rounded-lg text-white transition hover:opacity-90" style={{ background: ORG }}>
            Call Support
          </a>
        </div>
      </div>
    </div>
  );
}
