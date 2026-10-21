import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import { QuoteThesis, QuotePhilosophy } from '../components/Quotes';
import Team from '../components/Team';
import Intelligence from '../components/Intelligence';
import Footer from '../components/Footer';
import { usePageSeo } from '../lib/usePageSeo';

export default function Home() {
  usePageSeo({
    title: 'QuickHedge Inc. — Physical Education, Human Kinetics & Sports Science Platform',
    description: 'QuickHedge Inc. is Nigeria’s premier academic platform for Physical Education, Human Kinetics, and Sports Science. Access curriculum study materials, motor learning research, and sports psychology diagnostics.',
    canonicalPath: '/',
  });

  useEffect(() => {
    // Smooth scroll if URL has hash (e.g. #thesis, #philosophy, #intelligence, #team)
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#F0EEE8] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        {/* Hero with typed effect and soundwave equalizer on black */}
        <Hero />

        {/* Quote Sections from Wayback Machine: Thesis (White) & Philosophy (Black) */}
        <QuoteThesis />
        <QuotePhilosophy />

        {/* Team Section (White) */}
        <Team />

        {/* Intelligence Carousel (Dark #080808) */}
        <Intelligence />
      </main>
      <Footer />
    </div>
  );
}
