"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [loading, setLoading] = useState(false);
  const[query, setQuery] = useState('');
  const router = useRouter();

  const handleStartSession = async () => {
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
    <div style={styles.inputContainer}>
      <input
        type="text"
        placeholder="Example: Where is France located?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={styles.input}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleStartSession();
        }}
      />
      <button
        onClick={handleStartSession}
        disabled={loading}
        style={styles.button}
        title="Search"
      >
        {loading ? (
          <span className="spinner"></span>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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
    maxWidth: '560px',
    borderRadius: '24px',
    border: '1px solid rgba(100, 120, 255, 0.4)',
    boxShadow: '0 0 20px rgba(100, 120, 255, 0.15)',
    padding: '4px 8px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    transition: 'all 0.2s',
  },
  input: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '1.1rem',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#ffffff',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#7b8cff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }
};
