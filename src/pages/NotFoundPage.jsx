import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-32 text-center">
        <span className="text-[#00873E] text-xs uppercase tracking-[0.25em] font-mono font-bold mb-3">
          Error 404
        </span>
        <h1
          className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4"
          style={{ fontFamily: '"Besley", Georgia, serif' }}
        >
          Page Not Found
        </h1>
        <p className="text-white/60 text-base max-w-md mx-auto mb-8 font-light">
          The page you are looking for does not exist, has been relocated, or is temporarily unavailable.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-[#00873E] bg-[#00873E] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-[#006837] transition-colors shadow-md rounded-full"
        >
          <ArrowLeft size={14} />
          <span>Return to Homepage</span>
        </Link>
      </main>

      <Footer />
    </div>
  );
}
