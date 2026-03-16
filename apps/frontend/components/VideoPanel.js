"use client";
import { useEffect, useRef, useState } from "react";
import { speakWithElevenLabs } from "@/utils/TextToSpeech";

export default function VideoPanel({ sessionId, prompt }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [narration, setNarration] = useState("");
  const [step, setStep] = useState({ current: 0, total: 0 });
  const [ttsError, setTtsError] = useState(false);

  useEffect(() => {
    if (!sessionId || !prompt) return;

    const wsBaseUrl = (process.env.NEXT_PUBLIC_WS_URL || "").replace(/\/$/, "");
    if (!wsBaseUrl) {
      setStatus("error");
      setErrorMessage("NEXT_PUBLIC_WS_URL is missing in frontend .env");
      return;
    }

    let closedByDone = false;
    const wsUrl = `${wsBaseUrl}/uni/explain/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setErrorMessage("");
      ws.send(JSON.stringify({ prompt }));
      setStatus("planning");
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {

        case "planning":
          setStatus("planning");
          break;

        case "plan":
          setStatus("running");
          setStep({ current: 0, total: msg.total_steps });
          await speakWithElevenLabs(
            `Starting visual walkthrough of ${msg.topic}. ${msg.total_steps} steps.`
          ).catch(() => setTtsError(true));
          break;

        case "frame": {
          const canvas = canvasRef.current;
          if (!canvas) break;
          const img = new Image();
          img.onload = () =>
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          img.src = `data:image/jpeg;base64,${msg.data}`;
          break;
        }

        case "narration": {
          setNarration(msg.narration);
          setStep({ current: msg.step + 1, total: msg.total });
          try {
            await speakWithElevenLabs(msg.narration);
          } catch (e) {
            console.warn("TTS failed, sending ACK anyway:", e);
            setTtsError(true);
          }
          ws.send(JSON.stringify({ type: "ack" }));
          break;
        }

        case "done":
          setStatus("done");
          await speakWithElevenLabs("Visual walkthrough complete.")
            .catch(() => {});
          closedByDone = true;
          ws.close();
          break;

        case "error":
          setStatus("error");
          setErrorMessage(msg.message || "Backend returned an error");
          ws.close();
          break;

        default:
          break;
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setErrorMessage("WebSocket connection failed");
    };

    ws.onclose = (event) => {
      if (!closedByDone && event.code !== 1000) {
        setStatus("error");
        setErrorMessage((prev) => prev || `WebSocket closed (${event.code})`);
      }
    };

    return () => {
      ws.close();
    };
  }, [sessionId, prompt]);

  const statusLabel = {
    idle: "Enter a topic to begin",
    planning: "Generating plan…",
    running: `Step ${step.current} of ${step.total}`,
    done: "Complete",
    error: "Something went wrong",
  }[status];

  return (
    <div style={styles.wrapper}>
      <div style={styles.screen}>
        {(status === "idle" || status === "planning") ? (
          <p style={styles.placeholder}>{statusLabel}</p>
        ) : (
          <canvas ref={canvasRef} width={1280} height={720} style={styles.canvas} />
        )}
      </div>

      {narration && (
        <div style={styles.narrationBar}>
          <span style={styles.stepBadge}>{step.current}/{step.total}</span>
          <p style={styles.narrationText}>{narration}</p>
        </div>
      )}

      <div style={styles.statusRow}>
        <span style={styles.statusDot(status)} />
        <span style={styles.statusLabel}>{statusLabel}</span>
        {errorMessage && <span style={styles.errorText}>{errorMessage}</span>}
        {ttsError && (
          <span style={styles.ttsWarning}>TTS quota reached — check key or usage</span>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { width: "100%", backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "24px", borderRadius: "12px" },
  screen: { width: "100%", maxWidth: "900px", aspectRatio: "16/9", backgroundColor: "#111", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  canvas: { width: "100%", height: "100%", objectFit: "contain" },
  placeholder: { color: "#555", fontSize: "1rem" },
  narrationBar: { display: "flex", alignItems: "flex-start", gap: "12px", maxWidth: "900px", width: "100%", background: "#1a1a1a", borderRadius: "8px", padding: "12px 16px" },
  stepBadge: { background: "#4285f4", color: "#fff", borderRadius: "999px", padding: "2px 10px", fontSize: "0.75rem", whiteSpace: "nowrap" },
  narrationText: { color: "#ccc", fontSize: "0.9rem", margin: 0, lineHeight: "1.5" },
  statusRow: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem" },
  statusDot: (s) => ({ width: 8, height: 8, borderRadius: "50%", background: s === "running" ? "#34d399" : s === "error" ? "#f87171" : "#555" }),
  statusLabel: { color: "#555" },
  errorText: { color: "#f87171" },
  ttsWarning: { color: "#f59e0b", marginLeft: "8px" },
};