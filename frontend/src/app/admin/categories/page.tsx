'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CheckCircle, AlertCircle, Folder, Plus, Trash2, Edit3 } from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeLight: '#FF8A3D',
  orangeDark: '#c44d00',
};

interface CategoryField {
  id: number;
  field_key: string;
  label: string;
  field_type: string;
  options: string[];
  placeholder: string | null;
  is_required: boolean;
}

interface Category { id: number; name: string; type: string; description?: string; created_at: string; fields: CategoryField[]; }

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'boolean', label: 'Yes / No' },
];

const inputClass = 'border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500/30';
const inputStyle = { background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('products');
  const [msg, setMsg] = useState<React.ReactNode>('');

  const [fieldCategory, setFieldCategory] = useState<Category | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldMsg, setFieldMsg] = useState<React.ReactNode>('');

  const loadCategories = async (): Promise<Category[]> => {
    const { data } = await api.get('/categories');
    const list: Category[] = data.categories || [];
    setCategories(list);
    return list;
  };

  useEffect(() => {
    loadCategories().finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/categories', { name, type });
      setMsg(<><CheckCircle size={14} className="inline" style={{ color: '#2ea043' }} /> Category created</>);
      setName('');
      await loadCategories();
      setShowForm(false);
    } catch {
      setMsg(<><AlertCircle size={14} className="inline" style={{ color: '#f85149' }} /> Failed to create category</>);
    }
  };

  const startEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setShowForm(true);
    setMsg('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setMsg('');
    try {
      await api.put(`/categories/${editing.id}`, { name, type });
      setMsg(<><CheckCircle size={14} className="inline" style={{ color: '#2ea043' }} /> Category updated</>);
      await loadCategories();
      setEditing(null);
      setShowForm(false);
      setName('');
    } catch {
      setMsg(<><AlertCircle size={14} className="inline" style={{ color: '#f85149' }} /> Failed to update category</>);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    await loadCategories();
  };

  const openFields = (c: Category) => {
    setFieldCategory(c);
    setFieldMsg('');
    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setFieldRequired(false);
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldCategory) return;
    setFieldMsg('');
    try {
      await api.post(`/categories/${fieldCategory.id}/fields`, {
        label: fieldLabel,
        field_type: fieldType,
        options: fieldOptions,
        is_required: fieldRequired,
      });
      setFieldLabel('');
      setFieldOptions('');
      setFieldRequired(false);
      const updated = await loadCategories();
      setFieldCategory(updated.find((c) => c.id === fieldCategory.id) || null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFieldMsg(<><AlertCircle size={14} className="inline" style={{ color: '#f85149' }} /> {msg || 'Failed to add field'}</>);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!fieldCategory || !confirm('Delete this field? Listings keep the value they already stored.')) return;
    await api.delete(`/categories/${fieldCategory.id}/fields/${fieldId}`);
    const updated = await loadCategories();
    setFieldCategory(updated.find((c) => c.id === fieldCategory.id) || null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setName('');
    setMsg('');
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
        <form onSubmit={editing ? handleUpdate : handleCreate} className="rounded-2xl p-6 mb-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">{editing ? `Edit Category — ${editing.name}` : 'New Category'}</h2>
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
                style={{ background: BRAND.orange }}>{editing ? 'Update' : 'Save'}</button>
              <button type="button" onClick={closeForm}
                className="text-sm px-4 py-2.5 rounded-lg transition"
                style={{ color: '#6e7781', background: '#f6f8fa', border: '1px solid #d0d7de' }}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      {fieldCategory && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Posting details — {fieldCategory.name}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                These fields appear on the post form whenever a listing is created in this category.
              </p>
            </div>
            <button onClick={() => setFieldCategory(null)}
              className="text-sm px-3 py-1.5 rounded-lg"
              style={{ color: '#6e7781', background: '#f6f8fa', border: '1px solid #d0d7de' }}>Close</button>
          </div>

          {fieldCategory.fields.length === 0 ? (
            <p className="text-sm text-gray-500 mb-4">No fields yet — this category only asks for the standard listing details.</p>
          ) : (
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #d0d7de' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                    <th className="text-left px-4 py-2.5 text-gray-500 text-xs uppercase font-semibold tracking-wider">Label</th>
                    <th className="text-left px-4 py-2.5 text-gray-500 text-xs uppercase font-semibold tracking-wider">Key</th>
                    <th className="text-left px-4 py-2.5 text-gray-500 text-xs uppercase font-semibold tracking-wider">Type</th>
                    <th className="text-center px-4 py-2.5 text-gray-500 text-xs uppercase font-semibold tracking-wider">Required</th>
                    <th className="text-center px-4 py-2.5 text-gray-500 text-xs uppercase font-semibold tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fieldCategory.fields.map((field) => (
                    <tr key={field.id}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {field.label}
                        {field.options.length > 0 && (
                          <span className="block text-[11px] text-gray-500 mt-0.5">{field.options.join(', ')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{field.field_key}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{field.field_type}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600">{field.is_required ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDeleteField(field.id)}
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
          )}

          {fieldMsg && <p className="text-sm mb-3">{fieldMsg}</p>}

          <form onSubmit={handleAddField} className="grid sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Field label</label>
              <input value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} required
                placeholder="e.g. Brand, Mileage, Bedrooms"
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className={inputClass} style={inputStyle}>
                {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Options (comma separated)</label>
              <input value={fieldOptions} onChange={(e) => setFieldOptions(e.target.value)} disabled={fieldType !== 'select'}
                placeholder="New, Used, Refurbished" className={inputClass} style={inputStyle} />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={fieldRequired} onChange={(e) => setFieldRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300" /> Required
              </label>
              <button type="submit"
                className="text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2"
                style={{ background: BRAND.orange }}>
                <Plus size={14} /> Add Field
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: '#f0f2f5' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Type</th>
                <th className="text-center px-4 py-3 text-gray-500 text-xs uppercase font-semibold tracking-wider">Details</th>
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
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => (fieldCategory?.id === c.id ? setFieldCategory(null) : openFields(c))}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: '#0969da' }}>
                      {fieldCategory?.id === c.id ? 'Hide' : `${c.fields?.length || 0} field(s)`}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center gap-3 justify-center">
                      <button onClick={() => startEdit(c)}
                        className="text-xs font-semibold hover:underline flex items-center gap-1"
                        style={{ color: '#0969da' }}>
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="text-xs font-semibold hover:underline flex items-center gap-1"
                        style={{ color: '#f85149' }}>
                        <Trash2 size={12} /> Delete
                      </button>
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
