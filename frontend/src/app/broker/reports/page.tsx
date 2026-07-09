'use client';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const reports = [
  { id: 1, title: 'Monthly Performance Report', desc: 'Overview of deals closed and commissions earned this month.', type: 'PDF', date: 'Jun 2026' },
  { id: 2, title: 'Client Acquisition Report', desc: 'New clients acquired and conversion rates.', type: 'PDF', date: 'Q2 2026' },
  { id: 3, title: 'Property Listing Analytics', desc: 'Performance of all listed properties and views.', type: 'XLSX', date: 'Jun 2026' },
  { id: 4, title: 'Commission Statement', desc: 'Detailed breakdown of commissions earned.', type: 'PDF', date: 'May 2026' },
];

export default function BrokerReportsPage() {
  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
      <p className="text-sm text-gray-500 mb-6">Generate and download performance reports.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{r.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{r.desc}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">{r.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{r.date}</span>
              <button className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition hover:opacity-90" style={{ background: ORG }}>
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 text-sm mb-4">Generate Custom Report</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option>Report Type</option>
            <option>Transactions</option>
            <option>Commissions</option>
            <option>Clients</option>
          </select>
          <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button className="bg-[#0f1e42] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#162d5e] transition">
          Generate Report
        </button>
      </div>
    </div>
  );
}
