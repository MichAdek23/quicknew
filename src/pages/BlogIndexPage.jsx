import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  FileText,
  Calendar,
  User,
  ArrowRight,
  Search,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { usePageSeo } from '../lib/usePageSeo';

export default function BlogIndexPage() {
  usePageSeo({
    title: 'Academic Intelligence & Sports Science Ledger',
    description: 'Institutional research, kinesiology insights, motor learning analysis, and sports pedagogy guides from QuickHedge educators.',
    canonicalPath: '/blog',
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          content,
          thumbnail_url,
          created_at,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.warn('Error fetching blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((p) => {
    const term = search.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(term) ||
      (p.content || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0f0f0] font-sans selection:bg-[#00873E] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        {/* Hero Section */}
        <div className="relative border-b border-[#1f1f1f] bg-gradient-to-b from-[#09150d] via-[#080808] to-[#050505] py-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00873E]/10 border border-[#00873E]/30 text-[#00873E] font-mono text-xs uppercase tracking-widest mb-6">
              <BookOpen size={13} />
              <span>Intel &amp; Market Analysis</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold font-serif text-white tracking-tight leading-tight mb-6"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              The QuickHedge <span className="text-[#00873E]">Ledger</span>
            </h1>

            <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Academic intelligence, kinesiology research, sports pedagogy, and physical education insights straight from QuickHedge educators.
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-md mx-auto relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sports science insights, kinesiology research, or study materials…"
                className="w-full pl-10 pr-4 py-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-full text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00873E] shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          {loading ? (
            <div className="p-16 border border-[#1f1f1f] bg-[#0c0c0c] rounded-2xl text-center">
              <RefreshCw size={28} className="animate-spin text-[#00873E] mx-auto mb-3" />
              <p className="text-xs font-mono uppercase tracking-widest text-white/40">
                Retrieving Editorial Publications…
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-16 border border-[#1f1f1f] bg-[#0c0c0c] rounded-2xl text-center">
              <BookOpen size={40} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white font-serif mb-2" style={{ fontFamily: '"Besley", Georgia, serif' }}>
                No Articles Published Yet
              </h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                {search
                  ? 'No articles match your search query. Try another keyword.'
                  : 'Our research analysts are currently preparing upcoming intelligence briefings.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => {
                const author = post.profiles || {};
                const authorName = author.full_name || 'QuickHedge Research';
                const excerpt = (post.content || '')
                  .replace(/#|[*_`]/g, '')
                  .trim()
                  .substring(0, 140);

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug || post.id}`}
                    className="group flex flex-col bg-[#0c0c0c] border border-[#1f1f1f] hover:border-[#00873E]/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
                  >
                    {/* Cover Thumbnail */}
                    <div className="h-48 w-full bg-[#121212] overflow-hidden relative border-b border-[#1c1c1c]">
                      {post.thumbnail_url ? (
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#121212] via-[#161616] to-[#0a1e12] flex items-center justify-center p-6 text-center">
                          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#00873E]">
                            QuickHedge Ledger
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Article Details */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Author & Timestamp */}
                        <div className="flex items-center gap-2.5 text-[11px] text-white/40 mb-3">
                          <div className="w-5 h-5 rounded-full bg-[#00873E] text-white flex items-center justify-center font-bold text-[9px]">
                            {authorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white/70 font-medium truncate">{authorName}</span>
                          <span>•</span>
                          <span>
                            {post.created_at
                              ? new Date(post.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>

                        <h2
                          className="text-lg font-bold text-white font-serif group-hover:text-[#00873E] transition-colors line-clamp-2 leading-snug mb-2.5"
                          style={{ fontFamily: '"Besley", Georgia, serif' }}
                        >
                          {post.title}
                        </h2>

                        <p className="text-xs text-white/50 line-clamp-3 leading-relaxed">
                          {excerpt}...
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#1a1a1a] flex items-center justify-between text-xs font-mono text-[#00873E]">
                        <span className="font-semibold">Read Briefing</span>
                        <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
