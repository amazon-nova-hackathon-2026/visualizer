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

  // Chat state
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function checkSession() {
      // if already validated this session, skip the fetch
      const cached = sessionStorage.getItem(`valid-${sessionId}`);
      if (cached) {
        setIsValid(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/validate-session/${sessionId}`);
        if (!res.ok) throw new Error("Invalid session");
        setIsValid(true);
      } catch (error) {
        console.error(error);
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) checkSession();
    else setLoading(false);
  }, [sessionId]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setResponses((prev) => [...prev, { role: 'user', text: input }]);
    setSending(true);

    try {
      const res = await fetch(`/api/session/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const data = await res.json();

      const responseText = Array.isArray(data)
        ? (data.find(item => item.message)?.message || JSON.stringify(data))
        : (data.message || JSON.stringify(data));

      setResponses((prev) => [...prev, { role: 'agent', text: responseText }]);
    } catch (error) {
      console.error(error);
      setResponses((prev) => [...prev, { role: 'agent', text: "Error communicating." }]);
    } finally {
      setSending(false);
      setInput('');
    }
  };

  if (loading) return <div style={styles.center}>Loading session...</div>;
  if (!sessionId || !isValid) {
    return (
      <div style={styles.center}>
        <h2 style={styles.error}>Session missing or expired.</h2>
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

        {/* Simplified Inline ResponseBox */}
        <div style={styles.chatContainer}>
          <div style={styles.responseArea}>
            {responses.map((msg, idx) => (
              <div key={idx} style={msg.role === 'user' ? styles.userMsg : styles.agentMsg}>
                <strong>{msg.role === 'user' ? 'You' : 'Nova'}:</strong> {msg.text}
              </div>
            ))}
            {sending && <div style={styles.agentMsg}>Nova is thinking...</div>}
          </div>

          <div style={styles.inputContainer}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Send instructions to Nova..."
              autoComplete='off'
              style={styles.chatInput}
            />
            <button onClick={handleSend} disabled={sending} style={styles.sendButton}>
              Send
            </button>
          </div>
        </div>
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
  layout: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  chatContainer: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: '#f9f9f9' },
  responseArea: { flex: 1, overflowY: 'auto', marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '10px' },
  userMsg: { alignSelf: 'flex-end', backgroundColor: '#0070f3', color: '#fff', padding: '8px 12px', borderRadius: '8px', maxWidth: '80%', wordBreak: 'break-word' },
  agentMsg: { alignSelf: 'flex-start', backgroundColor: '#e0e0e0', color: '#000', padding: '8px 12px', borderRadius: '8px', maxWidth: '80%', wordBreak: 'break-word' },
  inputContainer: { display: 'flex', gap: '10px' },
  chatInput: { flex: 1, padding: '10px', fontSize: '1rem', borderRadius: '5px', border: '1px solid #ccc' },
  sendButton: { padding: '10px 20px', fontSize: '1rem', borderRadius: '20px', border: 'none', backgroundColor: '#000', color: '#fff', cursor: 'pointer', fontWeight: '500' }
};
