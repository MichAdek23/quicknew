import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  Eye,
  EyeOff,
  FolderOpen,
  Save,
  Loader2,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../lib/supabase';

export default function AdminTeamPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bio, setBio] = useState('');
  const [sectionLabel, setSectionLabel] = useState('');
  const [tags, setTags] = useState('');
  const [footerLabel, setFooterLabel] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTeam = async () => {
    setRefreshing(true);
    try {
      const { data, error: queryErr } = await supabase
        .from('team_members')
        .select('*')
        .order('sort_order', { ascending: true });

      if (queryErr) throw queryErr;
      setTeam(data || []);
    } catch (err) {
      console.warn('Error fetching team members:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const openCreateModal = () => {
    setEditingMember(null);
    setName('');
    setCredentials('');
    setTitle('');
    setImageUrl('');
    setBio('');
    setSectionLabel('Executive Mandate & Vision');
    setTags('');
    setFooterLabel('QuickHedge Executive Office');
    setSortOrder(team.length);
    setPublished(true);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setName(member.name || '');
    setCredentials(member.credentials || '');
    setTitle(member.title || '');
    setImageUrl(member.image_url || '');
    setBio(member.bio || '');
    setSectionLabel(member.section_label || '');
    setTags(member.tags || '');
    setFooterLabel(member.footer_label || '');
    setSortOrder(member.sort_order ?? 0);
    setPublished(member.published ?? true);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide the executive member name.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        credentials: credentials.trim() || null,
        title: title.trim() || null,
        image_url: imageUrl.trim() || null,
        bio: bio.trim() || null,
        section_label: sectionLabel.trim() || null,
        tags: tags.trim() || null,
        footer_label: footerLabel.trim() || null,
        sort_order: Number(sortOrder) || 0,
        published,
      };

      if (editingMember) {
        const { error: updateErr } = await supabase
          .from('team_members')
          .update(payload)
          .eq('id', editingMember.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('team_members')
          .insert([payload]);
        if (insertErr) throw insertErr;
      }

      setShowModal(false);
      fetchTeam();
    } catch (err) {
      setError(err?.message || 'Error saving team member to database.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (id, currentPublished) => {
    try {
      await supabase
        .from('team_members')
        .update({ published: !currentPublished })
        .eq('id', id);
      setTeam((prev) =>
        prev.map((m) => (m.id === id ? { ...m, published: !currentPublished } : m))
      );
    } catch (err) {
      console.error('Error updating published status:', err);
    }
  };

  const deleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    try {
      await supabase.from('team_members').delete().eq('id', id);
      setTeam((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Error deleting team member:', err);
    }
  };

  return (
    <AdminLayout title="Leadership & Team">
      <div className="max-w-[1500px]">
        {/* Section Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00873E] animate-pulse" />
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-700 font-semibold">Leadership</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Executive Leadership &amp; Team
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl font-light">
              Dynamic team roster stored in Supabase PostgreSQL team_members table.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchTeam}
              disabled={refreshing}
              className="border border-gray-200 bg-white px-4 py-2 text-xs uppercase tracking-widest text-gray-700 hover:text-gray-900 hover:border-[#00873E] hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs font-semibold rounded-full"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin text-[#00873E]' : 'text-[#00873E]'} />
              <span>{refreshing ? 'Syncing Live…' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#00873E] text-white hover:bg-[#006837] transition-colors flex items-center gap-2 cursor-pointer rounded-full shadow-xs"
            >
              <Plus size={14} />
              <span>Add Leader</span>
            </button>
          </div>
        </header>

        {/* Team Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400 font-mono">
            Loading team roster from Supabase…
          </div>
        ) : team.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-gray-200 bg-gray-50/50 p-8 rounded-2xl">
            <FolderOpen size={30} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-800 mb-1">No Team Members Found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Click &quot;Add Leader&quot; to populate your dynamic leadership roster in the database.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#00873E] text-white text-xs font-semibold rounded-full"
            >
              Add First Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.id}
                className="border border-gray-200 bg-white shadow-xs rounded-2xl p-6 flex flex-col justify-between hover:border-gray-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {member.image_url ? (
                        <img
                          src={member.image_url}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover border border-[#C2E7D0]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#E6F4EA] border border-[#C2E7D0] flex items-center justify-center text-[#006837] font-bold text-sm">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.credentials && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({member.credentials})
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-[#00873E] font-medium">{member.title}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePublished(member.id, member.published)}
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full cursor-pointer transition-colors font-semibold ${
                        member.published
                          ? 'bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0]'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                      title={member.published ? 'Published on live site' : 'Hidden from public'}
                    >
                      {member.published ? 'Live' : 'Draft'}
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                    {member.bio}
                  </p>

                  {member.tags && (
                    <div className="text-[10px] text-gray-500 font-mono bg-gray-50 p-2.5 rounded-xl border border-gray-200 mb-4">
                      {member.tags}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                  <span className="text-[10px] text-gray-400 font-mono">
                    Order: #{member.sort_order ?? 0}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      title="Edit Member"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMember(member.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Member"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add/Edit Member */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setShowModal(false)}
            />
            <div className="relative w-full max-w-xl bg-white border border-gray-200 p-6 sm:p-7 shadow-2xl rounded-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  {editingMember ? 'Edit Leadership Record' : 'Add Executive Leader'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Adeleke Paul Adeoye"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Credentials</label>
                    <input
                      type="text"
                      value={credentials}
                      onChange={(e) => setCredentials(e.target.value)}
                      placeholder="e.g. BSc, MSc, PhD"
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Title / Role</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Founder & Chief Executive Officer"
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Image URL / Path</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="e.g. /CEO_png.jpeg or https://..."
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Biography</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Detailed professional biography..."
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Section Label</label>
                    <input
                      type="text"
                      value={sectionLabel}
                      onChange={(e) => setSectionLabel(e.target.value)}
                      placeholder="e.g. Executive Mandate & Vision"
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Tags / Focus Areas</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. Physical Education • Human Kinetics • Sports Science Pedagogy"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="published-toggle"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: '#00873E' }}
                  />
                  <label htmlFor="published-toggle" className="text-gray-700 cursor-pointer select-none font-medium">
                    Published on live public website
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-[#00873E] text-white font-semibold rounded-full hover:bg-[#006837] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    <span>{saving ? 'Saving to Database…' : 'Save Member'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
