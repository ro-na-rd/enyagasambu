'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CheckCircle, AlertCircle, Folder, Plus, Trash2 } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeLight: '#FF8A3D',
  orangeDark: '#c44d00',
};

interface Category { id: number; name: string; type: string; description?: string; created_at: string; }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('products');
  const [msg, setMsg] = useState<React.ReactNode>('');

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
      setMsg(<><CheckCircle size={14} className="inline" style={{ color: '#2ea043' }} /> Category created</>);
      setName('');
      const { data } = await api.get('/categories');
      setCategories(data.categories || []);
      setShowForm(false);
    } catch {
      setMsg(<><AlertCircle size={14} className="inline" style={{ color: '#f85149' }} /> Failed to create category</>);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    const { data } = await api.get('/categories');
    setCategories(data.categories || []);
  };

  return (
    <div className="p-4 lg:p-8 animate-fadeInUp">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.orange}15` }}>
            <Folder size={18} style={{ color: BRAND.orange }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage listing categories</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2"
          style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl p-6 mb-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">New Category</h2>
          {msg && <p className="text-sm mb-3 text-gray-300">{msg}</p>}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Category name"
                className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
                <option value="products">Products</option>
                <option value="properties">Properties</option>
                <option value="vehicles">Vehicles</option>
                <option value="services">Services</option>
                <option value="auction">Auction</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit"
                className="text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                style={{ background: BRAND.orange }}>Save</button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2.5 rounded-lg transition"
                style={{ color: '#6e7781', background: '#f6f8fa', border: '1px solid #d0d7de' }}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Created</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-600">Loading...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-600">No categories found</td></tr>
              ) : categories.map((c, idx) => (
                <tr key={c.id} className="hover:bg-gray-50 transition" style={{ animationDelay: `${idx * 0.03}s` }}>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                      style={{ background: `${BRAND.navyLight}40`, color: '#6e7781' }}>{c.type}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => handleDelete(c.id)}
                      className="text-xs font-semibold hover:underline flex items-center gap-1 mx-auto"
                      style={{ color: '#f85149' }}>
                      <Trash2 size={12} /> Delete
                    </button>
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
