import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useAuth } from '../context/AuthContext';

const PREFIX = "Advance Mastery in ";
const PHRASES = ["Physical Education", "Human Kinetics", "Sports Science"];

// Soundwave Equalizer Heights (matching QuickHedge algorithm)
const equalizerHeights = Array.from({ length: 44 }, (_, i) => {
  const sinVal = (Math.sin(i * 0.72) + 1) / 2;
  const cosVal = (Math.cos(i * 0.31) + 1) / 2;
  return Math.round(16 + sinVal * 50 + cosVal * 24);
});

export default function Hero() {
  const { user, isAdmin } = useAuth();
  const dashboardHref = isAdmin ? '/admin/overview' : '/dashboard';
  const [index, setIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [phase, setPhase] = useState("initial"); // "initial" | "holding" | "deleting" | "typing"

  const currentTarget = `${PREFIX}${PHRASES[index]}`;

  // Breakdown for 2-line layout
  const line1 = typedText.slice(0, Math.min(15, typedText.length)); // "Advance Mastery"
  const rest = typedText.length > 15 ? typedText.slice(15).trimStart() : "";
  const prefixPart = rest.slice(0, Math.min(3, rest.length)); // "in "
  const dynamicPhrase = rest.slice(3); // "Physical Education" | "Human Kinetics" | "Sports Science"

  useEffect(() => {
    let timer;

    if (phase === "initial") {
      if (typedText.length < currentTarget.length) {
        timer = window.setTimeout(() => {
          setTypedText(currentTarget.slice(0, typedText.length + 1));
        }, 65);
      } else {
        setPhase("holding");
      }
    } else if (phase === "holding") {
      timer = window.setTimeout(() => setPhase("deleting"), 3000);
    } else if (phase === "deleting") {
      if (typedText.length > PREFIX.length) {
        timer = window.setTimeout(() => {
          setTypedText((prev) => prev.slice(0, -1));
        }, 48);
      } else {
        setIndex((prev) => (prev + 1) % PHRASES.length);
        setPhase("typing");
      }
    } else if (phase === "typing") {
      if (typedText.length < currentTarget.length) {
        timer = window.setTimeout(() => {
          setTypedText(currentTarget.slice(0, typedText.length + 1));
        }, 65);
      } else {
        setPhase("holding");
      }
    }

    return () => window.clearTimeout(timer);
  }, [currentTarget, phase, typedText]);

  return (
    <section
      className="hero-section-wrapper"
      style={{
        position: 'relative',
        display: 'flex',
        minHeight: '100dvh',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#000000',
        paddingTop: '110px',
        paddingBottom: '90px',
      }}
    >
      {/* Equalizer Soundwave Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex h-[48%] items-end gap-[clamp(3px,0.55vw,9px)] px-[clamp(0.75rem,2vw,2rem)] opacity-60"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 34%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 34%, black 100%)',
        }}
      >
        {equalizerHeights.map((h, i) => (
          <motion.span
            key={`bar-${h}-${i}`}
            className="block min-w-0 flex-1 origin-bottom"
            style={{
              height: `${h}%`,
              background:
                i % 11 === 8
                  ? 'repeating-linear-gradient(to top, rgba(0, 135, 62, 0.45) 0 3px, transparent 3px 8px)'
                  : 'repeating-linear-gradient(to top, rgba(240, 238, 232, 0.16) 0 3px, transparent 3px 8px)',
            }}
            animate={{
              scaleY: [0.52, 0.92, 0.64, 1, 0.58],
              opacity: [0.34, 0.72, 0.45, 0.8, 0.34],
            }}
            transition={{
              duration: 14 + (i % 7) * 0.9,
              delay: (i % 9) * -1.1,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1450px',
          paddingLeft: 'clamp(1.5rem, 4vw, 4rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 4rem)',
          margin: '0 auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          style={{
            margin: '0 auto',
            display: 'flex',
            maxWidth: '1350px',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Monumental Typewriter Headline with Scaled Typography */}
          <h1
            className="hero-headline"
            style={{
              fontFamily: "'Besley', Georgia, serif",
              fontSize: 'clamp(3.2rem, 7.5vw, 6.75rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.045em',
              fontWeight: 500,
              color: '#F0EEE8',
              minHeight: '2.25em',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
            aria-label={currentTarget}
          >
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
              {line1}
              {!rest && (
                <motion.span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    marginLeft: '0.08em',
                    fontSize: '0.78em',
                    lineHeight: 1,
                    color: '#00873E',
                    verticalAlign: 'baseline',
                  }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.72, repeat: Infinity, ease: 'linear' }}
                >
                  _
                </motion.span>
              )}
            </span>

            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
              {prefixPart}
              <span style={{ fontWeight: 400, fontStyle: 'italic', color: '#00873E' }}>
                {dynamicPhrase}
              </span>
              {rest && (
                <motion.span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    marginLeft: '0.08em',
                    fontSize: '0.78em',
                    lineHeight: 1,
                    color: '#00873E',
                    verticalAlign: 'baseline',
                  }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.72, repeat: Infinity, ease: 'linear' }}
                >
                  _
                </motion.span>
              )}
            </span>
          </h1>

          {/* Action CTAs: Direct Routes to Auth */}
          <div
            style={{
              marginTop: 'clamp(2.5rem, 5vh, 4rem)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '18px',
            }}
          >
            <Link
              href={user ? dashboardHref : '/signup'}
              className="hero-btn-primary group"
            >
              <span>Get Started</span>
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  transition: 'transform 0.3s ease',
                }}
                className="group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </Link>

            <Link
              href={user ? dashboardHref : '/login'}
              className="hero-btn-secondary"
            >
              {user ? 'Dashboard' : 'Sign In'}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
