import React from 'react';
import { motion } from 'framer-motion';

export function QuoteThesis() {
  return (
    <section
      id="thesis"
      className="quote-section-100vh bg-white border-t border-black/5 text-black"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: '5rem',
        paddingBottom: '5rem',
      }}
    >
      <div className="max-w-7xl mx-auto px-[clamp(1.5rem,4vw,3rem)] w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-8 md:mb-16">
            <span className="block w-6 h-px bg-[#00873E]" />
            <h2
              className="text-[11px] font-medium tracking-[0.2em] uppercase font-sans"
              style={{ color: 'rgba(0, 0, 0, 0.45)' }}
            >
              Our Thesis
            </h2>
          </div>
          <p
            className="text-[clamp(1.65rem,2vw+1rem,2.625rem)] leading-[1.4] tracking-tight"
            style={{ fontFamily: "'Besley', Georgia, serif", fontStyle: 'italic', fontWeight: 400, color: '#000000' }}
          >
            Physical education and human kinetics are foundational to human potential, health, and athletic mastery. Rigorous study, movement science, and evidence-based pedagogy empower scholars, educators, and athletes to achieve enduring excellence.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export function QuotePhilosophy() {
  return (
    <section
      id="philosophy"
      className="quote-section-100vh bg-black border-t border-white/5 text-white"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: '5rem',
        paddingBottom: '5rem',
        backgroundColor: '#000000',
        color: '#ffffff',
      }}
    >
      <div className="max-w-7xl mx-auto px-[clamp(1.5rem,4vw,3rem)] flex justify-end w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl md:text-right"
        >
          <div className="flex items-center gap-3 mb-8 md:mb-16 md:justify-end">
            <span className="block w-6 h-px bg-[#00873E]" />
            <h2
              className="text-[11px] font-medium tracking-[0.2em] uppercase font-sans"
              style={{ color: 'rgba(255, 255, 255, 0.45)' }}
            >
              Our Philosophy
            </h2>
          </div>
          <p
            className="text-[clamp(1.65rem,2vw+1rem,2.625rem)] leading-[1.4] tracking-tight"
            style={{ fontFamily: "'Besley', Georgia, serif", fontStyle: 'italic', fontWeight: 400, color: '#ffffff' }}
          >
            Education in human movement and sports science is founded on the conviction that physical literacy, disciplined kinetic training, and scientific inquiry foster lifelong vitality and leadership.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
