"use client";
import { useState } from 'react';
import SearchBar from '@/components/SearchBar';

const sampleQuestions = [
  { icon: "🧬", text: "Explain how the human immune system fights a virus" },
  { icon: "🧠", text: "How does a neural network learn from data?" },
  { icon: "🌊", text: "Walk me through how ocean currents affect climate" },
  { icon: "🚀", text: "How does a rocket engine produce thrust?" },
];



export default function Home() {
  const [query, setQuery] = useState('');

  return (
    <div style={styles.container}>
      {/* Background glow */}
      <div style={styles.bgGlow} />

      <main style={styles.main}>
        {/* Hero */}
        <div style={styles.titleGroup} className="fade-in-up">
          <h1 style={styles.title} className="gradient-text">ThinkOva</h1>
          <p style={styles.subtitle}>Ask a question. Watch the web teach you.</p>
        </div>

        {/* Search — full width stretch */}
        <div className="fade-in-up-1" style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'center' }}>
          <SearchBar query={query} setQuery={setQuery} />
        </div>

        {/* Sample questions */}
        <div style={styles.samplesWrap} className="fade-in-up-2">
          <p style={styles.samplesLabel}>Try asking</p>
          <div style={styles.samples}>
            {sampleQuestions.map((q) => (
              <button
                key={q.text}
                style={styles.sampleBtn}
                onClick={() => setQuery(q.text)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={styles.sampleIcon}>{q.icon}</span>
                <span style={styles.sampleText}>{q.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard hint */}
        <p style={styles.hint} className="fade-in-up-3">
          Press <kbd style={styles.kbd}>Enter</kbd> to start your visual walkthrough
        </p>
      </main>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0f1e',
    padding: '40px 24px',
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    top: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '400px',
    background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  main: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '36px',
    width: '100%',
    maxWidth: '660px',
  },
  titleGroup: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  title: {
    fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
    fontWeight: 700,
    letterSpacing: '-0.04em',
    margin: 0,
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: '1.05rem',
    color: '#94a3b8',
    fontWeight: 400,
    margin: 0,
  },



  /* Sample questions */
  samplesWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    width: '100%',
  },
  samplesLabel: {
    color: '#64748b',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: 500,
    margin: 0,
  },
  samples: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    width: '100%',
    maxWidth: '660px',
  },
  sampleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    fontSize: '0.82rem',
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    textAlign: 'left',
    lineHeight: 1.4,
  },
  sampleIcon: {
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  sampleText: {
    flex: 1,
  },

  hint: {
    color: '#475569',
    fontSize: '0.78rem',
    letterSpacing: '0.02em',
  },
  kbd: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '0.72rem',
    fontFamily: 'inherit',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '5px',
    color: '#64748b',
    marginLeft: '2px',
    marginRight: '2px',
  },
};
