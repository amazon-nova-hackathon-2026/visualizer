const VOICE_ID = process.env.NEXT_PUBLIC_VOICE_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function speakWithElevenLabs(text, apiKey) {
  if (!text || !apiKey) return;

  const response = await fetch(`${BASE_URL}/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.detail?.message || `ElevenLabs error ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  return new Promise((resolve) => {
    const source = audioCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(audioCtx.destination);
    source.onended = resolve;  
    source.start(0);
  });

}