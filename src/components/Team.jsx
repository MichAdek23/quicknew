import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { executiveLeader } from '../data/initialData';
import { dataService } from '../lib/dataService';
import { supabase } from '../lib/supabase';

export default function Team() {
  const [leader, setLeader] = useState(executiveLeader);

  useEffect(() => {
    let isMounted = true;

    const loadLiveTeam = async () => {
      const members = await dataService.getTeamMembers();
      if (isMounted && members && members.length > 0) {
        const m = members[0];
        setLeader({
          name: m.name,
          role: m.credentials || m.title || 'BSc, MSc, PhD',
          title: m.title || 'Founder & Director of Academic Research',
          img: m.image_url || '/CEO_png.jpeg',
          excerpt: m.bio || '',
          sectionLabel: m.section_label || 'Academic Leadership & Pedagogy',
          tags: m.tags || 'Physical Education • Human Kinetics • Sports Science Pedagogy',
          footerLabel: m.footer_label || 'Directorate of Physical Education & Sports Research',
        });
      }
    };

    loadLiveTeam();

    const channel = supabase
      .channel('team_members_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        loadLiveTeam();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!leader) {
    return null;
  }

  return (
    <section id="team" className="min-h-[75vh] md:min-h-0 py-16 md:py-32 lg:py-48 bg-white border-t border-black/5 flex flex-col justify-center md:block">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-12 md:mb-20">
            <span className="block w-6 h-px bg-[#00873E]" />
            <h2 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#00873E] font-sans">
              Our Team
            </h2>
          </div>

          {/* 4-Column Grid: Card in Leader's position (Col 1), excerpt spreading full width across remaining columns (Cols 2-4) */}
          <div className="qh-team-grid items-start">
            {/* Column 1: Leader card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="qh-team-card-col group cursor-default"
            >
              <div className="w-full aspect-square overflow-hidden mb-5 bg-[#f0f2f0] border border-black/5 rounded-2xl shadow-xs">
                <img
                  src={leader.img}
                  alt={leader.name}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover object-top grayscale transition-[filter] duration-700 group-hover:grayscale-0"
                />
              </div>
              <h3
                className="text-base md:text-lg font-medium tracking-tight mb-0.5 font-sans"
                style={{ color: '#000000', fontWeight: 600 }}
              >
                {leader.name}
              </h3>
              <p
                className="font-sans"
                style={{ color: '#00873E', fontWeight: 600, fontSize: '12.5px', letterSpacing: '0.04em' }}
              >
                {leader.role}
              </p>
              {leader.title && (
                <p
                  className="font-sans"
                  style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px', letterSpacing: '0.02em' }}
                >
                  {leader.title}
                </p>
              )}
              <div className="mt-3.5 h-px w-0 bg-[#00873E] transition-all duration-500 group-hover:w-full" />
            </motion.div>

            {/* Remaining Space: Excerpt spreading across full remaining width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="qh-team-text-col flex flex-col justify-start pt-1"
              style={{ width: '100%' }}
            >
              <span
                style={{
                  color: '#00873E',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  fontWeight: 700,
                  display: 'inline-block',
                  marginBottom: '1rem',
                }}
              >
                {leader.sectionLabel || 'Executive Mandate & Vision'}
              </span>
              <p
                className="qh-executive-excerpt font-sans leading-relaxed"
                style={{
                  color: '#0f172a',
                  fontSize: 'clamp(1.15rem, 1.45vw, 1.35rem)',
                  lineHeight: 1.85,
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  width: '100%',
                }}
              >
                {leader.excerpt}
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginTop: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid #eef0f2',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    color: '#64748b',
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {leader.tags || 'Physical Education • Human Kinetics • Sports Science Pedagogy'}
                </span>
                <span
                  style={{
                    color: '#00873E',
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {leader.footerLabel || 'Directorate of Physical Education & Sports Research'}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

