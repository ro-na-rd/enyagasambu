'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface Category { id: number; name: string; type: string; description?: string; created_at: string; }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('products');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data.categories || []))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/categories', { name, type });
      setMsg('✅ Category created');
      setName('');
      const { data } = await api.get('/categories');
      setCategories(data.categories || []);
      setShowForm(false);
    } catch {
      setMsg('❌ Failed to create category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    const { data } = await api.get('/categories');
    setCategories(data.categories || []);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage listing categories</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#E85D04] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#c04a00] transition">
          + Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">New Category</h2>
          {msg && <p className="text-sm mb-3">{msg}</p>}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Category name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#E85D04]">
                <option value="products">Products</option>
                <option value="properties">Properties</option>
                <option value="vehicles">Vehicles</option>
                <option value="services">Services</option>
                <option value="auction">Auction</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="bg-[#E85D04] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#c04a00] transition">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm px-4 py-2 hover:underline">Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center py-8 text-gray-400">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No categories found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{c.type}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 text-xs hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
