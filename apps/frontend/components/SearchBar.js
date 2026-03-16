"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar({ query, setQuery }) {
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleStartSession = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error("Failed to create session");

      const data = await res.json();
      const sessionId = Array.isArray(data) ? data[0].session_id : data.session_id;

      if (sessionId) {
        router.push(`/search?sessionId=${sessionId}&prompt=${encodeURIComponent(query)}`);
      } else {
        alert("Session ID not returned from backend.");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating session. Check that the backend is running and BACKEND_API_BASE_URL is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        ...styles.inputContainer,
        borderColor: focused ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.2)',
        boxShadow: focused
          ? '0 0 0 1px rgba(59, 130, 246, 0.15), 0 4px 24px rgba(59, 130, 246, 0.12)'
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      <input
        type="text"
        placeholder="Ask anything you want to learn about…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleStartSession();
        }}
      />
      <button
        onClick={handleStartSession}
        disabled={loading || !query.trim()}
        style={{
          ...styles.button,
          opacity: query.trim() ? 1 : 0.4,
        }}
        title="Search"
      >
        {loading ? (
          <span className="spinner"></span>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        )}
      </button>
    </div>
  );
}

const styles = {
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '900px',
    borderRadius: '28px',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    padding: '3px 6px 3px 0',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(12px)',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
  },
  input: {
    flex: 1,
    padding: '10px 24px',
    fontSize: '1rem',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#f0f2f5',
    letterSpacing: '0.01em',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    color: '#f97316',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, opacity 0.2s ease',
    flexShrink: 0,
  }
};
