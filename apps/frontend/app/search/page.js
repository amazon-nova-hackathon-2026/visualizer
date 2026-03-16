"use client";
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import VideoPanel from '@/components/VideoPanel';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px', backgroundColor: '#0a0f1e' }}>
        <span className="spinner" style={{ width: 24, height: 24 }}></span>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '8px' }}>Loading…</p>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const prompt = searchParams.get('prompt');
  const [isValid, setIsValid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function checkSession() {
      if (!sessionId) {
        setIsValid(false);
        setValidationError('Session missing.');
        setLoading(false);
        return;
      }

      const cached = sessionStorage.getItem(`valid-${sessionId}`);
      if (cached) {
        setIsValid(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/validate-session/${sessionId}`);
        if (!res.ok) throw new Error('Validation request failed');

        const data = await res.json();
        const hasError = data?.error || data?.code === 404;

        if (hasError) {
          throw new Error(data?.error || 'Invalid session');
        }

        setIsValid(true);
        sessionStorage.setItem(`valid-${sessionId}`, '1');
      } catch (error) {
        console.error(error);
        setIsValid(false);
        setValidationError('Session missing or expired.');
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div style={styles.center}>
        <span className="spinner" style={{ width: 24, height: 24 }}></span>
        <p style={styles.loadingText}>Verifying session…</p>
      </div>
    );
  }

  if (!sessionId || !isValid) {
    return (
      <div style={styles.center}>
        <p style={styles.errorIcon}>⚠</p>
        <h2 style={styles.errorTitle}>{validationError || 'Session missing or expired.'}</h2>
        <a href="/" style={styles.backLink}>← Back to Home</a>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <a href="/" style={styles.brand}>ThinkOva</a>
          {prompt && <span style={styles.promptLabel}>{prompt}</span>}
        </div>
        <a href="/" style={styles.endLink}>End Session</a>
      </header>

      <div style={styles.layout}>
        <VideoPanel sessionId={sessionId} prompt={prompt} />
        {!prompt && (
          <div style={styles.infoBox}>
            No prompt provided. <a href="/" style={styles.infoLink}>Start a new session</a>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '12px',
    backgroundColor: '#0a0f1e',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    marginTop: '8px',
  },
  errorIcon: {
    fontSize: '2rem',
    marginBottom: '4px',
  },
  errorTitle: {
    color: '#f87171',
    fontSize: '1.1rem',
    fontWeight: 500,
  },
  backLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    marginTop: '4px',
    transition: 'opacity 0.2s',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0a0f1e',
  },
  header: {
    padding: '12px 24px',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minWidth: 0,
  },
  brand: {
    color: '#f0f2f5',
    fontWeight: 600,
    fontSize: '1rem',
    textDecoration: 'none',
    letterSpacing: '-0.02em',
    flexShrink: 0,
  },
  promptLabel: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  endLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    flexShrink: 0,
  },
  layout: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'auto',
    padding: '20px 32px',
    gap: '16px',
    alignItems: 'center',
  },
  infoBox: {
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '14px 18px',
    fontSize: '0.9rem',
  },
  infoLink: {
    color: '#f97316',
    textDecoration: 'none',
    fontWeight: 500,
  },
};
