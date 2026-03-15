"use client";
import { useState } from "react";
import { speakWithElevenLabs } from "@/utils/TextToSpeech.js";

export default function TtsTest() {
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  console.log("BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
  console.log("VOICE_ID:", process.env.NEXT_PUBLIC_VOICE_ID);
  console.log("API key loaded:", !!apiKey);
  console.log("Full URL:", `${process.env.NEXT_PUBLIC_BASE_URL}/${process.env.NEXT_PUBLIC_VOICE_ID}`);
  const [text, setText] = useState("Hi Saatwik, how are you doing today?");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSpeak = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      setStatus("playing");
      await speakWithElevenLabs(text);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e.message);
      console.error("TTS error:", e);
    }
  };

  const statusColor = {
    idle: "#888",
    loading: "#f59e0b",
    playing: "#34d399",
    done: "#4285f4",
    error: "#f87171",
  }[status];

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>ElevenLabs TTS test</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        style={styles.textarea}
      />

      <button
        onClick={handleSpeak}
        disabled={status === "loading" || status === "playing"}
        style={styles.button}
      >
        {status === "loading" ? "Fetching audio…"
         : status === "playing" ? "Playing…"
         : "Speak"}
      </button>

      <p style={{ color: statusColor, fontSize: "0.9rem" }}>
        Status: {status}
        {errorMsg && ` — ${errorMsg}`}
      </p>
    </div>
  );
}

const styles = {
  page: {
    display: "flex", flexDirection: "column", gap: "16px",
    maxWidth: "560px", margin: "60px auto", padding: "0 24px",
    fontFamily: "system-ui, sans-serif",
  },
  title: { fontSize: "1.4rem", fontWeight: 600, color: "#202124" },
  textarea: {
    width: "100%", padding: "12px", fontSize: "1rem",
    border: "1px solid #ddd", borderRadius: "8px",
    resize: "vertical", outline: "none",
  },
  button: {
    padding: "10px 24px", fontSize: "1rem", fontWeight: 500,
    backgroundColor: "#4285f4", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer",
    opacity: 1, width: "fit-content",
  },
  checklist: {
    background: "#f8f8f8", borderRadius: "8px",
    padding: "16px", fontSize: "0.85rem",
    color: "#555", lineHeight: "2",
  },
  checkTitle: { fontWeight: 600, color: "#333", marginBottom: "4px" },
};