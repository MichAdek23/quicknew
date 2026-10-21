import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  FolderOpen,
  Plus,
  RefreshCw,
  FileText,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  X,
  Upload,
  Check,
  Search,
  Filter,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import MaterialThumbnail from '../components/MaterialThumbnail';
import MaterialCardSkeleton from '../components/MaterialCardSkeleton';
import { academicService } from '../lib/academicService';

const PAGE_SIZE = 50;

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('pdf');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchMaterials = async () => {
    setRefreshing(true);
    try {
      const data = await academicService.getMaterials(false);
      setMaterials(data);
    } catch (err) {
      console.warn('Error fetching materials:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const openCreateModal = () => {
    setTitle('');
    setDescription('');
    setType('pdf');
    setUrl('');
    setFile(null);
    setThumbnailUrl('');
    setThumbnailFile(null);
    setIsPublished(true);
    setError('');
    setShowModal(true);
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a material title.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let finalUrl = url.trim();

      // Upload media file to Supabase storage if selected
      if (file) {
        const uploadedUrl = await academicService.uploadFileToStorage(file, 'deployments');
        if (!uploadedUrl) throw new Error('Failed to upload file to storage.');
        finalUrl = uploadedUrl;
      }

      if (!finalUrl) {
        throw new Error('Please provide a Media File to upload or a direct URL.');
      }

      // Upload thumbnail if selected
      let finalThumb = thumbnailUrl.trim() || null;
      if (thumbnailFile) {
        const uploadedThumb = await academicService.uploadFileToStorage(thumbnailFile, 'deployments');
        if (uploadedThumb) finalThumb = uploadedThumb;
      }

      const res = await academicService.createMaterial({
        title,
        description,
        type,
        url: finalUrl,
        thumbnail_url: finalThumb,
        is_published: isPublished,
      });

      if (!res.success) throw new Error(res.error);

      setShowModal(false);
      fetchMaterials();
    } catch (err) {
      setError(err?.message || 'Deployment error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (id, current) => {
    try {
      await academicService.updateMaterial(id, { is_published: !current });
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_published: !current } : m))
      );
    } catch (err) {
      console.error('Error toggling publish status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this educational material?')) return;
    try {
      await academicService.deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      if (selectedPreview?.id === id) setSelectedPreview(null);
    } catch (err) {
      console.error('Error deleting material:', err);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const term = search.toLowerCase();
    const matchesSearch =
      m.title.toLowerCase().includes(term) || (m.description || '').toLowerCase().includes(term);
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const totalPages = Math.ceil(filteredMaterials.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredMaterials.length);
  const displayedMaterials = filteredMaterials.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const currentPageIds = displayedMaterials.map((m) => m.id);
  const allPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    currentPageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleToggleItem = (e, id) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  return (
    <AdminLayout
      title="Content Library"
      onRefresh={fetchMaterials}
      isRefreshing={refreshing}
      onSelectAll={handleToggleSelectAll}
      allSelected={allPageSelected}
      someSelected={somePageSelected}
      totalItems={filteredMaterials.length}
      page={currentPage}
      pageSize={PAGE_SIZE}
      onPrevPage={handlePrevPage}
      onNextPage={handleNextPage}
    >
      <div className="max-w-[1500px]">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 font-serif tracking-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Physical Education &amp; Sports Science Content Library
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-sans">
              Curate curriculum PDFs, sports pedagogy videos, and kinesiology research materials deployed to students and scholars.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchMaterials}
              disabled={refreshing}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:border-[#00873E] hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer rounded-full shadow-2xs"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin text-[#00873E]' : 'text-[#00873E]'} />
              <span>{refreshing ? 'Syncing…' : 'Refresh'}</span>
            </button>

            <Link
              href="/admin/premium-plans"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer rounded-full shadow-2xs font-mono"
            >
              <ShieldCheck size={14} className="text-amber-600" />
              <span>Premium Access</span>
            </Link>

            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#00873E] text-white hover:bg-[#006837] transition-colors flex items-center gap-2 cursor-pointer rounded-full shadow-xs"
            >
              <Plus size={14} />
              <span>Deploy Material</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials by title or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#00873E] transition-colors rounded-full"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 px-4 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#00873E] rounded-full cursor-pointer"
            >
              <option value="all">All Media Types ({materials.length})</option>
              <option value="pdf">PDF Documents</option>
              <option value="video">Strategy Videos</option>
              <option value="image">Diagrams &amp; Infographics</option>
            </select>
          </div>

          <div className="text-xs font-mono text-gray-500">
            {materials.filter((m) => m.is_published).length} Live &bull;{' '}
            {materials.filter((m) => !m.is_published).length} Drafts
          </div>
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <MaterialCardSkeleton key={idx} />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-gray-200 bg-gray-50/50 p-8 rounded-2xl">
            <FolderOpen size={30} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm font-semibold text-gray-900 mb-1">No Materials Found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Deploy your first PDF guide, video lecture, or infographic to the platform library.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#00873E] text-white text-xs font-semibold rounded-full shadow-xs cursor-pointer"
            >
              Deploy First Material
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedMaterials.map((mat) => {
              const isVideo = mat.type === 'video';
              const isPdf = mat.type === 'pdf';
              const isSelected = selectedIds.has(mat.id);

              return (
                <div
                  key={mat.id}
                  className={`border bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-200 relative ${
                    isSelected
                      ? 'border-[#00873E] ring-2 ring-[#00873E]/30'
                      : 'border-gray-200/90 hover:border-gray-300'
                  }`}
                >
                  <div>
                    {/* Media Thumbnail */}
                    <div className="relative h-[352px] bg-[#001e2b] flex items-center justify-center overflow-hidden border-b border-gray-100">
                      <MaterialThumbnail mat={mat} />

                      {/* Card Checkbox Pill */}
                      <div
                        className="absolute top-3 left-3 z-20"
                        onClick={(e) => handleToggleItem(e, mat.id)}
                      >
                        <button
                          type="button"
                          aria-label={isSelected ? 'Deselect material' : 'Select material'}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#00873E] text-white shadow-sm ring-2 ring-white'
                              : 'bg-white/85 backdrop-blur-xs text-gray-500 hover:text-gray-900 hover:bg-white border border-gray-300/80 shadow-2xs'
                          }`}
                        >
                          {isSelected ? (
                            <Check size={15} strokeWidth={3} />
                          ) : (
                            <span className="w-3 h-3 rounded-xs border border-gray-400" />
                          )}
                        </button>
                      </div>

                      <div className="absolute top-2 right-2 z-10 pointer-events-none">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full shadow-xs ${
                            mat.is_published
                              ? 'bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0] font-medium'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {mat.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-1 leading-snug font-serif" style={{ fontFamily: '"Besley", Georgia, serif' }}>
                        {mat.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                        {mat.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-100 mt-2">
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#00873E] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Open Link</span>
                      <ExternalLink size={11} />
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePublished(mat.id, mat.is_published)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                        title={mat.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {mat.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(mat.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-full cursor-pointer transition-colors"
                        title="Delete Material"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Deploy Material */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setShowModal(false)}
            />
            <div className="relative w-full max-w-xl bg-white border border-gray-200 p-6 shadow-2xl rounded-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-base font-bold text-gray-900 font-serif" style={{ fontFamily: '"Besley", Georgia, serif' }}>
                  Deploy Content Material
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleDeploy} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Material Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Motor Learning and Sports Psychology Study Guide"
                    className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-gray-900 rounded-xl focus:border-[#00873E] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive overview of key principles..."
                    className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-gray-900 rounded-xl focus:border-[#00873E] focus:bg-white outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Content Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-gray-700 rounded-xl focus:border-[#00873E] outline-none cursor-pointer"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="video">Strategy Video (MP4 / WebM / URL)</option>
                      <option value="image">Diagram / Infographic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Direct Remote URL (Optional if uploading file)
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://... or select file below"
                      className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-gray-900 rounded-xl focus:border-[#00873E] focus:bg-white outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Upload File Box */}
                <div className="border border-dashed border-gray-300 bg-gray-50 p-5 rounded-xl text-center">
                  <Upload size={22} className="mx-auto text-gray-400 mb-2" />
                  <label className="text-xs text-[#00873E] font-semibold cursor-pointer hover:underline block mb-1">
                    <span>{file ? file.name : 'Select Media File to Upload to Supabase Storage'}</span>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".pdf,.mp4,.webm,.mov,.png,.jpg,.jpeg,.svg,.webp"
                    />
                  </label>
                  <p className="text-[11px] text-gray-400 font-mono">
                    PDF, MP4, WebM, PNG, JPG supported (saved to Supabase storage)
                  </p>
                </div>

                {/* Optional Thumbnail Upload */}
                <div className="border border-gray-200 p-3.5 rounded-xl bg-gray-50">
                  <label className="block text-gray-700 font-semibold mb-1">
                    Custom Cover Thumbnail (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="material-publish-toggle"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded cursor-pointer"
                    style={{ accentColor: '#00873E' }}
                  />
                  <label htmlFor="material-publish-toggle" className="text-gray-700 cursor-pointer select-none font-medium">
                    Publish immediately to student catalogue
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#00873E] text-white font-semibold rounded-full hover:bg-[#006837] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    <span>{saving ? 'Uploading to Storage & Deploying…' : 'Deploy Material'}</span>
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
