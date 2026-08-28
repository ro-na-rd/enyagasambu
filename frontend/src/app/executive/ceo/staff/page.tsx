'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Users, Plus, Search, Edit3, Trash2, CheckCircle,
  Ban, Eye, EyeOff, X, Key, Sparkles
} from '@/lib/icons';

const BRAND = {
  navy: '#0f1e42',
  navyLight: '#1a2d5a',
  navyDark: '#0a1430',
  orange: '#E85D04',
  orangeLight: '#FF8A3D',
  orangeDark: '#c44d00',
};

interface StaffMember {
  id: number;
  username: string;
  phone: string;
  role: string;
  executive_role: string | null;
  is_active: number;
  last_login: string | null;
  created_at: string;
}

const STAFF_ROLES = [
  { value: 'admin', label: 'Admin', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  { value: 'staff', label: 'Staff', color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
  { value: 'moderator', label: 'Moderator', color: '#d29922', bg: 'rgba(210,153,34,0.1)' },
];

const EXEC_ROLES = ['CEO', 'CIO', 'COO', 'CMO', 'CFO'];

export default function CEOStaffManagementPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [form, setForm] = useState({ username: '', password: '', phone: '', role: 'staff', executive_role: '' });
  const [editForm, setEditForm] = useState({ phone: '', role: 'staff', executive_role: '', is_active: true });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchStaff = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    api.get(`/executive/staff?${params.toString()}`)
      .then(({ data }) => { setStaffList(data.staff || []); setTotal(data.total || 0); })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchStaff(); }, [search, roleFilter]);

  const handleCreate = async () => {
    if (!form.username || !form.password) return;
    setSubmitting(true);
    try {
      await api.post('/executive/staff', {
        username: form.username,
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
        executive_role: form.executive_role || undefined,
      });
      setShowCreateModal(false);
      setForm({ username: '', password: '', phone: '', role: 'staff', executive_role: '' });
      fetchStaff();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingStaff) return;
    setSubmitting(true);
    try {
      await api.put(`/executive/staff/${editingStaff.id}`, {
        phone: editForm.phone,
        role: editForm.role,
        executive_role: editForm.executive_role || null,
        is_active: editForm.is_active,
      });
      setShowEditModal(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff account?')) return;
    try {
      await api.delete(`/executive/staff/${id}`);
      fetchStaff();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete staff');
    }
  };

  const handleToggleActive = async (staff: StaffMember) => {
    try {
      await api.put(`/executive/staff/${staff.id}`, { is_active: !staff.is_active });
      fetchStaff();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return;
    setSubmitting(true);
    try {
      await api.post('/executive/change-password', pwForm);
      setShowPasswordModal(false);
      setPwForm({ currentPassword: '', newPassword: '' });
      alert('Password changed successfully');
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditForm({
      phone: staff.phone || '',
      role: staff.role,
      executive_role: staff.executive_role || '',
      is_active: !!staff.is_active,
    });
    setShowEditModal(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openPassword = (_staff: StaffMember) => {
    setShowPasswordModal(true);
  };

  const getRoleStyle = (role: string) => {
    const found = STAFF_ROLES.find(r => r.value === role);
    return found || { value: role, label: role, color: '#6e7781', bg: 'rgba(110,119,129,0.1)' };
  };

  return (
    <div className="space-y-6 max-w-[1400px] animate-fadeInUp">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
        style={{ background: `linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 50%, #1a2d5a 100%)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 opacity-15"
          style={{ background: `radial-gradient(circle, ${BRAND.orange}, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} style={{ color: BRAND.orange }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: `${BRAND.orange}bb` }}>Staff Management</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1 tracking-tight">Team Accounts</h1>
            <p className="text-sm text-white/40">Create and manage admin, staff, and moderator accounts.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10">
              <Users size={14} className="text-white/50" />
              <span className="text-xs font-medium text-white/60">{total} accounts</span>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              <Key size={13} /> Change My Password
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: BRAND.orange, color: '#fff' }}>
              <Plus size={13} /> Add Staff
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchStaff(); }}
            placeholder="Search by username or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border outline-none"
            style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 text-xs font-medium outline-none"
          style={{ background: '#f6f8fa', borderColor: '#d0d7de', color: '#1a1a1a' }}>
          <option value="">All Roles</option>
          {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        {(search || roleFilter) && (
          <button onClick={() => { setSearch(''); setRoleFilter(''); }}
            className="text-[11px] font-bold px-3 py-2 rounded-lg transition"
            style={{ color: BRAND.orange, background: `${BRAND.orange}10` }}>
            Clear
          </button>
        )}
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users size={40} className="text-gray-700 mb-3" />
            <p className="text-sm text-gray-600">No staff accounts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Exec Role</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s) => {
                  const roleStyle = getRoleStyle(s.role);
                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 transition"
                      style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})` }}>
                            {s.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-semibold text-gray-900">{s.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-gray-600">{s.phone || '—'}</td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: roleStyle.bg, color: roleStyle.color }}>
                          {roleStyle.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-gray-600">
                        {s.executive_role ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${BRAND.navy}15`, color: BRAND.navy }}>
                            {s.executive_role}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleToggleActive(s)}
                          className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition hover:opacity-80"
                          style={{
                            background: s.is_active ? 'rgba(46,160,67,0.1)' : 'rgba(248,81,73,0.1)',
                            color: s.is_active ? '#2ea043' : '#f85149'
                          }}>
                          {s.is_active ? <CheckCircle size={12} /> : <Ban size={12} />}
                          {s.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-[11px] text-gray-500">
                        {s.last_login ? new Date(s.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(s)}
                            className="p-1.5 rounded-lg transition hover:bg-gray-100"
                            title="Edit">
                            <Edit3 size={14} className="text-gray-700" />
                          </button>
                          <button onClick={() => openPassword(s)}
                            className="p-1.5 rounded-lg transition hover:bg-gray-100"
                            title="Reset password">
                            <Key size={14} className="text-gray-700" />
                          </button>
                          {s.executive_role !== 'CEO' && (
                            <button onClick={() => handleDelete(s.id)}
                              className="p-1.5 rounded-lg transition hover:bg-red-50"
                              title="Delete">
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Plus size={18} style={{ color: BRAND.orange }} />
                <h2 className="text-lg font-bold text-gray-900">Add Staff Account</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Username *</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#d0d7de' }} placeholder="e.g. john_doe" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 pr-10 text-sm outline-none focus:ring-2"
                    style={{ borderColor: '#d0d7de' }} placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#d0d7de' }} placeholder="+250700000000" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Role *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#d0d7de' }}>
                  {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Executive Role (optional)</label>
                <select value={form.executive_role} onChange={e => setForm({ ...form, executive_role: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#d0d7de' }}>
                  <option value="">None</option>
                  {EXEC_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={submitting || !form.username || !form.password}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND.orange }}>
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Edit3 size={18} style={{ color: BRAND.orange }} />
                <h2 className="text-lg font-bold text-gray-900">Edit: {editingStaff.username}</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#d0d7de' }} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Role</label>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#d0d7de' }}>
                  {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Executive Role</label>
                <select value={editForm.executive_role} onChange={e => setEditForm({ ...editForm, executive_role: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#d0d7de' }}>
                  <option value="">None</option>
                  {EXEC_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-700">Status</label>
                <button onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ background: editForm.is_active ? '#2ea043' : '#d0d7de' }}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs text-gray-600">{editForm.is_active ? 'Active' : 'Disabled'}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition">
                Cancel
              </button>
              <button onClick={handleEdit} disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND.orange }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change My Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Key size={18} style={{ color: BRAND.orange }} />
                <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Current Password</label>
                <input type="password" value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#d0d7de' }} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">New Password</label>
                <input type="password" value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#d0d7de' }} placeholder="Min 6 characters" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition">
                Cancel
              </button>
              <button onClick={handleChangePassword} disabled={submitting || !pwForm.currentPassword || !pwForm.newPassword}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND.orange }}>
                {submitting ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
