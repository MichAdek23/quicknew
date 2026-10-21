import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Share2,
  Bookmark,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { usePageSeo } from '../lib/usePageSeo';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  usePageSeo({
    title: post ? post.title : 'Loading Academic Research Article…',
    description: post ? (post.excerpt || `Read ${post.title} on QuickHedge Inc.`) : 'Academic sports science research and pedagogical intelligence.',
    canonicalPath: `/blog/${slug || ''}`,
    ogType: 'article',
  });

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        // Try by slug first
        let { data, error: fetchErr } = await supabase
          .from('blog_posts')
          .select(`
            *,
            profiles (
              full_name,
              avatar_url
            )
          `)
          .eq('slug', slug)
          .eq('published', true)
          .maybeSingle();

        // Fallback by ID if slug not matched
        if (!data && !fetchErr) {
          const { data: byIdData } = await supabase
            .from('blog_posts')
            .select(`
              *,
              profiles (
                full_name,
                avatar_url
              )
            `)
            .eq('id', slug)
            .eq('published', true)
            .maybeSingle();

          data = byIdData;
        }

        if (!data) {
          setError('Article not found or currently unlisted.');
        } else {
          setPost(data);
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load article.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Helper to render markdown-like content into stylized elements
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith('# ')) {
        return (
          <h2
            key={idx}
            className="text-2xl sm:text-3xl font-bold font-serif text-white mt-10 mb-4 tracking-tight"
            style={{ fontFamily: '"Besley", Georgia, serif' }}
          >
            {trimmed.replace('# ', '')}
          </h2>
        );
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        return (
          <h3
            key={idx}
            className="text-xl sm:text-2xl font-bold font-serif text-white mt-8 mb-3 tracking-tight"
            style={{ fontFamily: '"Besley", Georgia, serif' }}
          >
            {trimmed.replace('## ', '')}
          </h3>
        );
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        return (
          <h4
            key={idx}
            className="text-lg font-bold font-serif text-emerald-400 mt-6 mb-2 tracking-tight"
            style={{ fontFamily: '"Besley", Georgia, serif' }}
          >
            {trimmed.replace('### ', '')}
          </h4>
        );
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            className="border-l-2 border-[#00873E] pl-4 py-1.5 my-4 text-white/80 italic font-serif text-sm bg-white/[0.02]"
            style={{ fontFamily: '"Besley", Georgia, serif' }}
          >
            {trimmed.replace('> ', '')}
          </blockquote>
        );
      }

      // Bullet List
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-white/70 text-sm leading-relaxed mb-1">
            {trimmed.replace(/^[-*]\s+/, '')}
          </li>
        );
      }

      // Empty line
      if (trimmed === '') {
        return <div key={idx} className="h-4" />;
      }

      // Regular paragraph
      return (
        <p key={idx} className="text-sm sm:text-base text-white/75 leading-relaxed mb-4 font-sans">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0f0f0] font-sans selection:bg-[#00873E] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
            <Loader2 size={32} className="animate-spin text-[#00873E] mb-3" />
            <p className="text-xs font-mono uppercase tracking-widest text-white/50">
              Loading Research Briefing…
            </p>
          </div>
        ) : error || !post ? (
          <div className="max-w-xl mx-auto px-6 py-20 text-center">
            <div className="p-8 border border-red-500/20 bg-[#0c0c0c] rounded-2xl">
              <AlertTriangle size={36} className="text-rose-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold font-serif text-white mb-2" style={{ fontFamily: '"Besley", Georgia, serif' }}>
                Article Unavailable
              </h2>
              <p className="text-xs text-white/60 mb-6">{error || 'Post not found.'}</p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#141414] border border-[#2a2a2a] text-xs font-mono uppercase tracking-wider text-white hover:border-[#00873E] transition-colors rounded-full"
              >
                <ArrowLeft size={14} />
                <span>Return to Intelligence Ledger</span>
              </Link>
            </div>
          </div>
        ) : (
          <article>
            {/* Dynamic Cover Hero */}
            <div
              className="relative w-full h-[55vh] min-h-[380px] max-h-[560px] bg-[#0c0c0c] flex items-end overflow-hidden border-b border-[#222222]"
              style={{
                backgroundImage: post.thumbnail_url
                  ? `url(${post.thumbnail_url})`
                  : 'linear-gradient(135deg, #07190d 0%, #050505 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Gradient Shaders for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
              <div className="absolute inset-0 bg-black/40" />

              <div className="relative z-10 max-w-4xl mx-auto w-full px-6 pb-12">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white mb-6 px-3.5 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Return to Intelligence Ledger</span>
                </Link>

                <h1
                  className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-white tracking-tight leading-tight mb-4 text-shadow-lg"
                  style={{ fontFamily: '"Besley", Georgia, serif' }}
                >
                  {post.title}
                </h1>

                {/* Author and Metadata Bar */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/70 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#00873E] text-white flex items-center justify-center font-bold text-[10px]">
                      {(post.profiles?.full_name || 'Admin').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">
                      {post.profiles?.full_name || 'QuickHedge Research'}
                    </span>
                  </div>

                  <span>•</span>

                  <span>
                    {post.created_at
                      ? new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : ''}
                  </span>

                  <span>•</span>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-1.5 text-[#00873E] hover:underline cursor-pointer"
                  >
                    {copied ? <Check size={12} /> : <Share2 size={12} />}
                    <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Article Content Container */}
            <div className="max-w-3xl mx-auto px-6 py-14">
              <div className="prose prose-invert max-w-none">
                {renderFormattedContent(post.content)}
              </div>

              {/* End of article signature */}
              <div className="mt-16 pt-8 border-t border-[#222222] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-[#00873E] mb-1">
                    QuickHedge Intelligence
                  </div>
                  <p className="text-xs text-white/50">
                    Published under editorial review by the QuickHedge executive research committee.
                  </p>
                </div>

                <Link
                  href="/blog"
                  className="px-5 py-2.5 bg-[#141414] border border-[#2a2a2a] text-xs font-mono uppercase tracking-wider text-white hover:border-[#00873E] transition-colors rounded-full flex items-center gap-2 flex-shrink-0"
                >
                  <ArrowLeft size={13} />
                  <span>Back to All Articles</span>
                </Link>
              </div>
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
