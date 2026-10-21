import React, { useState, useEffect } from 'react';
import {
  PlaySquare,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  FolderOpen,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../lib/supabase';

export default function AdminVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  // Form states
  const [youtubeId, setYoutubeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchVideos = async () => {
    setRefreshing(true);
    try {
      const { data, error: queryErr } = await supabase
        .from('site_videos')
        .select('*')
        .order('sort_order', { ascending: true });

      if (queryErr) throw queryErr;
      setVideos(data || []);
    } catch (err) {
      console.warn('Error fetching site videos:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const openCreateModal = () => {
    setEditingVideo(null);
    setYoutubeId('');
    setTitle('');
    setDescription('');
    setSortOrder(videos.length);
    setPublished(true);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setYoutubeId(video.youtube_id || '');
    setTitle(video.title || '');
    setDescription(video.description || '');
    setSortOrder(video.sort_order ?? 0);
    setPublished(video.published ?? true);
    setError('');
    setShowModal(true);
  };

  // Helper to extract 11-char YouTube ID if user pastes full URL
  const sanitizeYoutubeId = (input) => {
    const raw = input.trim();
    const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : raw;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanId = sanitizeYoutubeId(youtubeId);
    if (!cleanId) {
      setError('Please provide a valid YouTube video ID or URL.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a video title.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        youtube_id: cleanId,
        title: title.trim(),
        description: description.trim() || null,
        sort_order: Number(sortOrder) || 0,
        published,
      };

      if (editingVideo) {
        const { error: updateErr } = await supabase
          .from('site_videos')
          .update(payload)
          .eq('id', editingVideo.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('site_videos')
          .insert([payload]);
        if (insertErr) throw insertErr;
      }

      setShowModal(false);
      fetchVideos();
    } catch (err) {
      setError(err?.message || 'Error saving video to database.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (id, currentPublished) => {
    try {
      await supabase
        .from('site_videos')
        .update({ published: !currentPublished })
        .eq('id', id);
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, published: !currentPublished } : v))
      );
    } catch (err) {
      console.error('Error toggling video status:', err);
    }
  };

  const deleteVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await supabase.from('site_videos').delete().eq('id', id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Error deleting video:', err);
    }
  };

  return (
    <AdminLayout title="Intelligence Videos">
      <div className="max-w-[1500px]">
        {/* Section Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00873E] animate-pulse" />
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-700 font-semibold">Videos</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              QuickHedge Intelligence Videos
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl font-light">
              Curate executive YouTube video broadcasts streamed dynamically to the public platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchVideos}
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
              <span>Add Video</span>
            </button>
          </div>
        </header>

        {/* Video Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400 font-mono">
            Loading video roster from Supabase…
          </div>
        ) : videos.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-gray-200 bg-gray-50/50 p-8 rounded-2xl">
            <FolderOpen size={30} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-800 mb-1">No Videos Found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Add YouTube broadcasts to appear in the QuickHedge Intelligence section.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#00873E] text-white text-xs font-semibold rounded-full"
            >
              Add First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="border border-gray-200 bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between hover:border-gray-300 transition-colors"
              >
                <div>
                  {/* YouTube Thumbnail Preview */}
                  <div className="relative aspect-video bg-gray-100 group overflow-hidden border-b border-gray-100">
                    <img
                      src={`https://img.youtube.com/vi/${vid.youtube_id}/hqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                    <a
                      href={`https://youtube.com/watch?v=${vid.youtube_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/15 transition-colors"
                      title="Watch on YouTube"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#00873E] flex items-center justify-center text-white shadow-lg">
                        <PlaySquare size={22} className="ml-0.5" />
                      </div>
                    </a>

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold shadow-2xs ${
                          vid.published
                            ? 'bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0]'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                      >
                        {vid.published ? 'Live' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 leading-snug">
                      {vid.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3">
                      {vid.description || 'QuickHedge Intelligence video series.'}
                    </p>
                    <p className="text-[10px] font-mono text-gray-400 truncate">
                      ID: {vid.youtube_id}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-100 mt-2">
                  <span className="text-[10px] text-gray-400 font-mono">
                    Order: #{vid.sort_order ?? 0}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => togglePublished(vid.id, vid.published)}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      title={vid.published ? 'Unpublish' : 'Publish'}
                    >
                      {vid.published ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(vid)}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      title="Edit Video"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteVideo(vid.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Video"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add/Edit Video */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setShowModal(false)}
            />
            <div className="relative w-full max-w-lg bg-white border border-gray-200 p-6 sm:p-7 shadow-2xl rounded-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  {editingVideo ? 'Edit Intelligence Video' : 'Add Intelligence Video'}
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
                  <label className="block text-gray-700 font-semibold mb-1">
                    YouTube Video ID or URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={youtubeId}
                    onChange={(e) => setYoutubeId(e.target.value)}
                    placeholder="e.g. nnuhlcTqIzc or https://youtube.com/watch?v=..."
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none font-mono"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    You can paste either the 11-character video ID or full YouTube watch link.
                  </span>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Video Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Your Business Reflects You | QuickHedge Intelligence"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Concise overview of discussion topics..."
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none font-sans"
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

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="video-published-toggle"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: '#00873E' }}
                  />
                  <label htmlFor="video-published-toggle" className="text-gray-700 cursor-pointer select-none font-medium">
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
                    <span>{saving ? 'Saving to Database…' : 'Save Video'}</span>
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
