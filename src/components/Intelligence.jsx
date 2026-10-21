import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react';
import { initialVideos } from '../data/initialData';
import { dataService } from '../lib/dataService';
import { supabase } from '../lib/supabase';

export default function Intelligence() {
  const [videos, setVideos] = useState(initialVideos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadLiveVideos = async () => {
      const live = await dataService.getSiteVideos();
      if (isMounted && live && live.length > 0) {
        setVideos(
          live.map((v) => ({
            id: v.youtube_id || v.id,
            title: v.title,
            description: v.description || '',
            thumbnailUrl: v.thumbnail_url || `https://i.ytimg.com/vi/${v.youtube_id || v.id}/hq720.jpg`,
            watchUrl: `https://www.youtube.com/watch?v=${v.youtube_id || v.id}`,
          }))
        );
      }
    };

    loadLiveVideos();

    // Subscribe to realtime updates for site_videos
    const channel = supabase
      .channel('site_videos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_videos' }, () => {
        loadLiveVideos();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!videos || videos.length === 0) {
    return null;
  }

  const safeIndex = Math.min(currentIndex, videos.length - 1);
  const currentVideo = videos[safeIndex] || videos[0];

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  return (
    <section id="intelligence" className="py-16 md:py-32 lg:py-48 bg-[#080808] border-t border-white/5 text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-8 md:mb-16">
          <div className="flex items-center gap-3">
            <span className="block w-6 h-px bg-[#00873E]" />
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/30 font-sans">
              QuickHedge Intelligence
            </h2>
          </div>
          <span className="text-[11px] text-white/40 font-mono">
            {currentIndex + 1} of {videos.length}
          </span>
        </div>

        {/* Video Player & Detail Grid */}
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-12" data-testid="intelligence-feature">
          {/* Video Player Box */}
          <div className="relative aspect-video w-full overflow-hidden bg-black rounded-sm border border-white/10 shadow-2xl group">
            {isPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&rel=0`}
                title={currentVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                className="relative w-full h-full cursor-pointer flex items-center justify-center"
                onClick={() => setIsPlaying(true)}
              >
                <img
                  src={currentVideo.thumbnailUrl}
                  alt={currentVideo.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#00873E] flex items-center justify-center text-white shadow-2xl transition-transform duration-300 group-hover:scale-110 hover:bg-[#006837]">
                  <Play size={28} className="fill-white translate-x-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* Video Details & Carousel Navigation */}
          <div className="flex min-w-0 flex-col gap-8 lg:gap-10" data-testid="intelligence-feature-text">
            <div className="flex flex-col justify-between gap-6 min-w-0">
              <AnimatePresence mode="wait">
                <motion.h3
                  key={currentVideo.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="font-serif text-2xl md:text-3xl xl:text-4xl leading-tight text-white tracking-tight break-words"
                  style={{ fontFamily: '"Besley", Georgia, serif' }}
                >
                  {currentVideo.title}
                </motion.h3>
              </AnimatePresence>

              {currentVideo.description && (
                <p className="text-white/60 text-sm md:text-base font-light leading-relaxed">
                  {currentVideo.description}
                </p>
              )}

              {/* Navigation Controls */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous video"
                    className="w-10 h-10 rounded-full border border-white/20 bg-transparent flex items-center justify-center text-white hover:border-[#00873E] hover:bg-[#00873E] transition-all duration-300 cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next video"
                    className="w-10 h-10 rounded-full border border-white/20 bg-transparent flex items-center justify-center text-white hover:border-[#00873E] hover:bg-[#00873E] transition-all duration-300 cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Dots Indicator */}
                <div className="flex items-center gap-2" role="group" aria-label="Choose video">
                  {videos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentIndex(idx);
                      }}
                      aria-label={`Show video ${idx + 1}`}
                      className="w-4 h-4 flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          idx === currentIndex
                            ? 'w-2.5 h-2.5 bg-[#00873E]'
                            : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* External YouTube link */}
              <div>
                <a
                  href={currentVideo.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/40 hover:text-[#00873E] transition-colors font-semibold"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
