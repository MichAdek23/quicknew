import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  UserCheck,
  UserX,
  CreditCard,
  RefreshCw,
  FolderOpen,
  User,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../lib/supabase';

export default function AdminApplicationsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [mutating, setMutating] = useState(false);
  const [mutationMessage, setMutationMessage] = useState('');

  const fetchLiveRecords = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.warn('Error fetching live records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveRecords();
  }, []);

  const handleToggleRole = async () => {
    if (!selectedRecord) return;
    const nextRole = selectedRecord.role === 'admin' ? 'student' : 'admin';
    setMutating(true);
    setMutationMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', selectedRecord.id);

      if (error) throw error;

      setSelectedRecord({ ...selectedRecord, role: nextRole });
      setRecords((prev) =>
        prev.map((r) => (r.id === selectedRecord.id ? { ...r, role: nextRole } : r))
      );
      setMutationMessage(`Role updated to "${nextRole}".`);
    } catch (err) {
      console.error('Failed to toggle role:', err);
      setMutationMessage('Failed to update role in Supabase.');
    } finally {
      setMutating(false);
    }
  };

  const handleToggleSubscription = async () => {
    if (!selectedRecord) return;
    const nextSub = !selectedRecord.is_subscribed;
    setMutating(true);
    setMutationMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_subscribed: nextSub })
        .eq('id', selectedRecord.id);

      if (error) throw error;

      setSelectedRecord({ ...selectedRecord, is_subscribed: nextSub });
      setRecords((prev) =>
        prev.map((r) => (r.id === selectedRecord.id ? { ...r, is_subscribed: nextSub } : r))
      );
      setMutationMessage(nextSub ? 'Subscription granted.' : 'Subscription revoked.');
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
      setMutationMessage('Failed to update subscription in Supabase.');
    } finally {
      setMutating(false);
    }
  };

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ['id', 'full_name', 'email', 'role', 'is_subscribed', 'is_verified', 'created_at'];
    const rows = records.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quickhedge_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.username?.toLowerCase().includes(search.toLowerCase()) ||
      r.id?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' || r.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout title="Members & Records">
      <div className="max-w-[1500px]">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 font-serif tracking-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Members &amp; Records
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-sans">
              Live database records of registered members and accounts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchLiveRecords}
              disabled={refreshing}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:border-[#00873E] hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer rounded-full shadow-2xs"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin text-[#00873E]' : 'text-[#00873E]'} />
              <span>{refreshing ? 'Refreshing…' : 'Sync Records'}</span>
            </button>
            <div className="text-xs font-mono px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
              {records.length} Records
            </div>
          </div>
        </div>

        <div>
          {/* Filter and Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, member ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#00873E] transition-colors rounded-full"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 px-4 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#00873E] rounded-full cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="student">Students &amp; Founders</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <button
              type="button"
              onClick={exportCSV}
              disabled={records.length === 0}
              className="border border-gray-200 bg-white px-4 py-2 text-xs uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:border-[#00873E] hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer font-semibold rounded-full shadow-2xs disabled:opacity-40"
            >
              <Download size={13} className="text-[#00873E]" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Records Table or Live Empty State */}
          {loading ? (
            <div className="border border-gray-200 bg-gray-50/50 p-16 text-center text-xs text-gray-500 font-mono rounded-2xl">
              Loading records from Supabase PostgreSQL…
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="border border-dashed border-gray-200 bg-gray-50/50 p-16 text-center rounded-2xl">
              <FolderOpen size={36} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No Database Records Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                {search || roleFilter !== 'all'
                  ? 'No database records matched your search filters.'
                  : 'Newly registered accounts and inquiries will appear here dynamically in real time.'}
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 bg-white overflow-x-auto shadow-xs rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] uppercase tracking-widest text-gray-500 font-mono">
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Username</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Verification</th>
                    <th className="py-3 px-4 font-semibold">Registered</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-[#00873E]" />
                          <span>{r.full_name || (r.first_name ? `${r.first_name} ${r.last_name || ''}`.trim() : 'Member')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#00873E]">
                        {r.username ? `@${r.username}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600">{r.email || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] uppercase font-mono tracking-wider border rounded-full font-medium ${
                            r.role === 'admin'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-gray-100 border-gray-200 text-gray-600'
                          }`}
                        >
                          {r.role || 'student'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] uppercase font-mono tracking-wider border rounded-full font-medium ${
                            r.is_verified
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}
                        >
                          {r.is_verified ? 'Verified' : 'Pending OTP'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-400">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(r)}
                          className="px-3 py-1 text-xs font-semibold border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-[#00873E] hover:bg-gray-50 transition-colors rounded-full cursor-pointer bg-white"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Record Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white border border-gray-200 w-full max-w-lg p-6 sm:p-8 rounded-2xl shadow-2xl relative text-gray-900">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1"
                aria-label="Close details modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#00873E] font-mono mb-2 font-semibold">
                <span>Record Details</span>
              </div>
              <h2 className="text-xl font-bold font-serif mb-4" style={{ fontFamily: '"Besley", Georgia, serif' }}>
                {selectedRecord.full_name || (selectedRecord.first_name ? `${selectedRecord.first_name} ${selectedRecord.last_name || ''}`.trim() : 'Member Details')}
              </h2>

              <div className="space-y-3 text-xs divide-y divide-gray-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500">Database UUID:</span>
                  <span className="font-mono text-gray-700">{selectedRecord.id}</span>
                </div>
                {selectedRecord.username && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-500">Username:</span>
                    <span className="font-mono text-[#00873E]">@{selectedRecord.username}</span>
                  </div>
                )}
                {selectedRecord.first_name && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-500">First Name:</span>
                    <span className="font-semibold text-gray-900">{selectedRecord.first_name}</span>
                  </div>
                )}
                {selectedRecord.last_name && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-500">Last Name:</span>
                    <span className="font-semibold text-gray-900">{selectedRecord.last_name}</span>
                  </div>
                )}
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-mono text-gray-700">{selectedRecord.email || '—'}</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-gray-500">Assigned Role:</span>
                  <span className="font-mono uppercase font-bold text-[#00873E] bg-[#E6F4EA] px-2 py-0.5 rounded-full text-[10px]">
                    {selectedRecord.role}
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-gray-500">Subscription Status:</span>
                  <span className={`font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedRecord.is_subscribed ? 'text-emerald-800 bg-emerald-100' : 'text-gray-600 bg-gray-100'}`}>
                    {selectedRecord.is_subscribed ? 'Active Premium' : 'Free Tier'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-gray-500">Email Verified:</span>
                  <span className={`font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedRecord.is_verified ? 'text-emerald-800 bg-emerald-100' : 'text-amber-800 bg-amber-100'}`}>
                    {selectedRecord.is_verified ? 'Verified (OTP)' : 'Unverified'}
                  </span>
                </div>
              </div>

              {mutationMessage && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#00873E]" />
                  <span>{mutationMessage}</span>
                </div>
              )}

              {/* Administrative Actions */}
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-widest text-gray-400 font-semibold">
                  Account Controls
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleRole}
                    disabled={mutating}
                    className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 hover:border-[#00873E] hover:text-[#00873E] hover:bg-white text-xs font-mono tracking-wider text-gray-700 transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {mutating ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : selectedRecord.role === 'admin' ? (
                      <UserX size={13} className="text-rose-500" />
                    ) : (
                      <UserCheck size={13} className="text-[#00873E]" />
                    )}
                    <span>{selectedRecord.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleSubscription}
                    disabled={mutating}
                    className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 hover:border-[#00873E] hover:text-[#00873E] hover:bg-white text-xs font-mono tracking-wider text-gray-700 transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {mutating ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CreditCard size={13} className="text-[#00873E]" />
                    )}
                    <span>{selectedRecord.is_subscribed ? 'Revoke Premium' : 'Grant Premium'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
