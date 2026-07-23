'use client';
import { useState } from 'react';
import { FileText, Edit3, Trash2, Plus } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  orange: '#E85D04',
  orangeDark: '#c44d00',
};

const contentItems = [
  { id: 1, title: 'Welcome to E-Nyagasambu', type: 'Page', status: 'Published', updated: '2 days ago' },
  { id: 2, title: 'Terms of Service', type: 'Page', status: 'Published', updated: '1 week ago' },
  { id: 3, title: 'Privacy Policy', type: 'Page', status: 'Draft', updated: '3 days ago' },
  { id: 4, title: 'About Us', type: 'Page', status: 'Published', updated: '2 weeks ago' },
  { id: 5, title: 'How to Sell', type: 'Guide', status: 'Draft', updated: '5 days ago' },
  { id: 6, title: 'FAQ', type: 'Page', status: 'Published', updated: '1 month ago' },
];

export default function AdminContentPage() {
  const [items] = useState(contentItems);

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <FileText size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Content Management</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage pages, guides, and site content</p>
          </div>
        </div>
        <button className="text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 mt-3"
          style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
          <Plus size={16} /> New Page
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Type</th>
                <th className="text-center px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Updated</th>
                <th className="text-center px-4 py-3 text-gray-400 text-xs uppercase font-semibold tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3.5 font-medium text-gray-800">{item.title}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: `${BRAND.navy}50`, color: '#6e7781' }}>{item.type}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      item.status === 'Published'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{item.updated}</td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="text-xs font-semibold flex items-center gap-1 hover:underline"
                        style={{ color: BRAND.orange }}><Edit3 size={12} /> Edit</button>
                      <button className="text-xs font-semibold flex items-center gap-1 hover:underline"
                        style={{ color: '#f85149' }}><Trash2 size={12} /> Delete</button>
                    </div>
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
