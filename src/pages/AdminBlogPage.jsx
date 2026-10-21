import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  X,
  Upload,
  Check,
  Search,
  Loader2,
  BookOpen,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { academicService } from '../lib/academicService';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [published, setPublished] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    setRefreshing(true);
    try {
      const data = await academicService.getBlogPosts(false);
      setPosts(data);
    } catch (err) {
      console.warn('Error fetching blog posts:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openCreateModal = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setContent('');
    setThumbnailUrl('');
    setThumbnailFile(null);
    setPublished(false);
    setPreviewMode(false);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setTitle(post.title || '');
    setSlug(post.slug || '');
    setContent(post.content || '');
    setThumbnailUrl(post.thumbnail_url || '');
    setThumbnailFile(null);
    setPublished(post.published ?? false);
    setPreviewMode(false);
    setError('');
    setShowModal(true);
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    if (!editingPost) {
      const generatedSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Article title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Article content cannot be empty.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let finalThumb = thumbnailUrl.trim() || null;
      if (thumbnailFile) {
        const uploadedThumb = await academicService.uploadFileToStorage(thumbnailFile, 'blog_thumbnails');
        if (uploadedThumb) finalThumb = uploadedThumb;
      }

      const res = await academicService.upsertBlogPost({
        id: editingPost?.id,
        title,
        slug,
        content,
        thumbnail_url: finalThumb,
        published,
      });

      if (!res.success) throw new Error(res.error);

      setShowModal(false);
      fetchPosts();
    } catch (err) {
      setError(err?.message || 'Failed to save blog post.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (id, current) => {
    try {
      await academicService.upsertBlogPost({
        id,
        title: posts.find((p) => p.id === id)?.title || '',
        content: posts.find((p) => p.id === id)?.content || '',
        published: !current,
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, published: !current } : p))
      );
    } catch (err) {
      console.error('Error toggling publish state:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to archive / delete this article?')) return;
    try {
      await academicService.deleteBlogPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting blog post:', err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const term = search.toLowerCase();
    return p.title.toLowerCase().includes(term) || (p.slug || '').toLowerCase().includes(term);
  });

  return (
    <AdminLayout title="Blog Engine">
      <div className="max-w-[1500px]">
        {/* Section Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00873E] animate-pulse" />
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-700 font-semibold">Editorial</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Editorial &amp; Research Blog Engine
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl font-light">
              Publish sports science research papers, kinesiology analysis, and pedagogical guides directly to the public website.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchPosts}
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
              <span>Write Article</span>
            </button>
          </div>
        </header>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles by title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00873E] rounded-xl shadow-2xs font-mono"
            />
          </div>

          <div className="text-xs font-mono text-gray-500 font-medium">
            <span className="text-[#006837] font-semibold">{posts.filter((p) => p.published).length} Published</span> &bull;{' '}
            <span className="text-gray-500">{posts.filter((p) => !p.published).length} Drafts</span>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400 font-mono">
            Loading articles from Supabase…
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-gray-200 bg-gray-50/50 p-8 rounded-2xl">
            <FolderOpen size={30} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-800 mb-1">No Articles Published</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Write and deploy editorial insights to appear in the public Research &amp; Insights section.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#00873E] text-white text-xs font-semibold rounded-full"
            >
              Write First Article
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between hover:border-gray-300 transition-colors"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden border-b border-gray-100">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen size={32} />
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold shadow-2xs ${
                          post.published
                            ? 'bg-[#E6F4EA] text-[#006837] border border-[#C2E7D0]'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                      >
                        {post.published ? 'Live' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 leading-snug font-serif">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3">
                      {post.content.replace(/#|\*|`|_/g, '').substring(0, 160)}…
                    </p>
                    <p className="text-[10px] font-mono text-gray-400 truncate">
                      /{post.slug}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-100 mt-2">
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#00873E] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Read Live</span>
                    <ExternalLink size={11} />
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => togglePublished(post.id, post.published)}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      title={post.published ? 'Unpublish' : 'Publish'}
                    >
                      {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(post)}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      title="Edit Article"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Archive Article"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Write/Edit Article */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setShowModal(false)}
            />
            <div className="relative w-full max-w-3xl bg-white border border-gray-200 p-6 sm:p-7 shadow-2xl rounded-2xl z-10 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  {editingPost ? 'Edit Research Article' : 'Write New Research Article'}
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
                  <label className="block text-gray-700 font-semibold mb-1">Article Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Why Starting Before You Feel Ready Changes Everything"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">URL Slug</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="article-url-slug"
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Cover Thumbnail URL (or upload below)
                    </label>
                    <input
                      type="text"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-gray-900 rounded-xl focus:border-[#00873E] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 p-3 rounded-xl bg-gray-50">
                  <label className="block text-gray-700 font-semibold mb-1">
                    Upload Cover Image (Saved to Supabase storage)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="text-xs text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-gray-700 font-semibold">
                      Content (Markdown Supported) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="text-[11px] text-[#00873E] font-mono hover:underline cursor-pointer font-semibold"
                    >
                      {previewMode ? 'Back to Editor' : 'Preview Output'}
                    </button>
                  </div>

                  {previewMode ? (
                    <div className="w-full min-h-[220px] max-h-[350px] overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {content || 'Nothing to preview yet.'}
                    </div>
                  ) : (
                    <textarea
                      rows={10}
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your article in Markdown. Headings (##), bullet points, blockquotes, and bold text are supported..."
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 text-gray-900 rounded-xl focus:border-[#00873E] outline-none font-sans leading-relaxed text-xs"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="blog-publish-toggle"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: '#00873E' }}
                  />
                  <label htmlFor="blog-publish-toggle" className="text-gray-700 cursor-pointer select-none font-medium">
                    Publish immediately on live public website
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
                    <span>{saving ? 'Publishing to Database…' : 'Save Article'}</span>
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
