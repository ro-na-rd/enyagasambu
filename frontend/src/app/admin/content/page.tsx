'use client';
import { useState } from 'react';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

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
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage pages, guides, and site content</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Updated</th>
              <th className="text-center px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.type}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    item.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>{item.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{item.updated}</td>
                <td className="px-4 py-3 text-center">
                  <button className="text-[#E85D04] text-xs hover:underline mr-3">Edit</button>
                  <button className="text-red-500 text-xs hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
