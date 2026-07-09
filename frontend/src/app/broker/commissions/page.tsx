'use client';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const earnings = [
  { id: 1, source: 'Sale: 3-Bedroom House Kacyiru', amount: 'RWF 4,250', date: '15 Jun 2026', status: 'Paid' },
  { id: 2, source: 'Sale: Toyota Hilux 2020', amount: 'RWF 1,400', date: '1 Jun 2026', status: 'Paid' },
  { id: 3, source: 'Sale: Commercial Plot Gishushu', amount: 'RWF 6,000', date: '10 Jun 2026', status: 'Pending' },
  { id: 4, source: 'Referral Bonus: Client Introduction', amount: 'RWF 200', date: '5 Jun 2026', status: 'Paid' },
];

export default function BrokerCommissionsPage() {
  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Commission & Earnings</h1>
      <p className="text-sm text-gray-500 mb-6">Track your commissions and earnings.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Earned', value: 'RWF 11,850', color: NAVY },
          { label: 'This Month', value: 'RWF 5,650', color: ORG },
          { label: 'Pending', value: 'RWF 6,000', color: '#d97706' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Commission History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {earnings.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-700">{e.source}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{e.amount}</td>
                  <td className="px-4 py-3 text-gray-400">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${e.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
