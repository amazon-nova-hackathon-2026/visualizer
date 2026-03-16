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
      const totalFromMsg = Number(msg.total ?? msg.total_steps ?? step.total ?? 0);
      const stepIndex = Number(msg.step ?? msg.current_step ?? 0);
      const stepCurrent = Number.isFinite(stepIndex) ? stepIndex + 1 : step.current;
      const narrationText = (msg.narration ?? msg.text ?? "").trim();

      switch (msg.type) {
        case "planning":
          setStatus("planning");
          break;

        case "plan":
          setStatus("running");
          setStep({ current: 0, total: Number(msg.total_steps ?? 0) });
          break;

        case "step":
          setStatus("running");
          setStep((prev) => ({
            current: stepCurrent,
            total: totalFromMsg || prev.total,
          }));
          if (!narrationText && msg.query) {
            setNarration(msg.query);
          }
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
          setStatus("running");
          if (narrationText) {
            setNarration(narrationText);
          }
          setStep((prev) => ({
            current: stepCurrent,
            total: totalFromMsg || prev.total,
          }));
          try {
            if (narrationText) {
              await speakWithElevenLabs(narrationText);
            }
          } catch (e) {
            console.warn("TTS failed, sending ACK anyway:", e);
            setTtsError(true);
          }
          ws.send(JSON.stringify({ type: "ack" }));
          break;
        }

        case "done":
          setStatus("done");
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

  const progress = step.total > 0 ? step.current / step.total : 0;

  return (
    <div style={styles.wrapper}>
      {/* Video viewport */}
      <div style={styles.screenContainer}>
        <div style={styles.screen}>
          {status === "idle" || status === "planning" ? (
            <div style={styles.placeholderWrap}>
              {status === "planning" && (
                <>
                  <span className="spinner" style={{ width: 28, height: 28, marginBottom: 16 }}></span>
                  <p style={styles.placeholderTitle}>Preparing your walkthrough</p>
                  <p style={styles.placeholderSub}>Searching the web and building a plan…</p>
                </>
              )}
              {status === "idle" && (
                <p style={styles.placeholderTitle}>Waiting to start…</p>
              )}
            </div>
          ) : (
            <canvas ref={canvasRef} width={1600} height={813} style={styles.canvas} />
          )}
        </div>

        {/* Progress bar — overlaid at bottom of video */}
        {(status === "running" || status === "done") && step.total > 0 && (
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressBar,
                width: `${(status === "done" ? 1 : progress) * 100}%`,
                backgroundColor: status === "done" ? "#34d399" : "#3b82f6",
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom bar: narration + status */}
      <div style={styles.bottomBar}>
        {/* Left: step + narration */}
        <div style={styles.narrationSection}>
          {step.total > 0 && (
            <span style={styles.stepBadge}>
              {status === "done" ? "✓" : `${step.current}/${step.total}`}
            </span>
          )}
          <p style={styles.narrationText}>
            {status === "done"
              ? "Walkthrough complete"
              : status === "error"
                ? errorMessage || "Something went wrong"
                : narration || (status === "planning" ? "Generating plan…" : "Waiting…")}
          </p>
        </div>

        {/* Right: status indicators */}
        <div style={styles.statusSection}>
          {status === "running" && (
            <span style={styles.liveIndicator}>
              <span style={styles.liveDot} />
              LIVE
            </span>
          )}
          {status === "done" && (
            <span style={styles.doneIndicator}>Complete</span>
          )}
          {status === "error" && (
            <span style={styles.errorIndicator}>Error</span>
          )}
          {ttsError && (
            <span style={styles.ttsWarning}>Audio unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },
  screenContainer: {
    position: "relative",
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
  },
  screen: {
    width: "100%",
    aspectRatio: "1600/813",
    backgroundColor: "#0f1729",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  canvas: {
    width: "100%",
    height: "100%",
    display: "block",
  },
  placeholderWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  placeholderTitle: {
    color: "#94a3b8",
    fontSize: "1rem",
    fontWeight: 500,
    margin: 0,
  },
  placeholderSub: {
    color: "#475569",
    fontSize: "0.85rem",
    margin: 0,
  },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "3px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  progressBar: {
    height: "100%",
    transition: "width 0.5s ease",
  },
  bottomBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "14px 20px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderTop: "none",
    borderRadius: "0 0 16px 16px",
  },
  narrationSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: 0,
  },
  stepBadge: {
    background: "rgba(59, 130, 246, 0.12)",
    color: "#3b82f6",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "0.72rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
    letterSpacing: "0.03em",
    flexShrink: 0,
  },
  narrationText: {
    color: "#cbd5e1",
    fontSize: "0.85rem",
    margin: 0,
    lineHeight: "1.5",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  statusSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#34d399",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#34d399",
    animation: "pulse 1.5s ease infinite",
  },
  doneIndicator: {
    color: "#34d399",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  errorIndicator: {
    color: "#f87171",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  ttsWarning: {
    color: "#fbbf24",
    fontSize: "0.72rem",
  },
};