"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import VideoPanel from '@/components/VideoPanel';

export default function SearchPage() {
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

      // if already validated this session, skip the fetch
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

  if (loading) return <div style={styles.center}>Loading session...</div>;
  if (!sessionId || !isValid) {
    return (
      <div style={styles.center}>
        <h2 style={styles.error}>{validationError || 'Session missing or expired.'}</h2>
        <a href="/" style={styles.link}>Go back to Home</a>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h3>Session: {sessionId}</h3>
        <a href="/" style={styles.link}>End Session</a>
      </header>

      <div style={styles.layout}>
        <VideoPanel sessionId={sessionId} prompt={prompt} />
        {!prompt && (
          <div style={styles.infoBox}>No prompt provided for this session. Start a new session from Home.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' },
  error: { color: 'red', marginBottom: '20px' },
  link: { color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' },
  container: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' },
  header: { padding: '10px 20px', backgroundColor: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  layout: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto', padding: '20px', gap: '12px', backgroundColor: '#111' },
  infoBox: { color: '#f5f5f5', backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px', padding: '12px 16px' }
};
