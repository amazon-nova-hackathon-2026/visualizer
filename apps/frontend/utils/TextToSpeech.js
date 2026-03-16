export async function speakWithElevenLabs(text) {
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  const voiceId = process.env.NEXT_PUBLIC_VOICE_ID;
  const baseUrl =
    (process.env.NEXT_PUBLIC_BASE_URL || "https://api.elevenlabs.io/v1/text-to-speech").replace(/\/$/, "");

  if (!text || !text.trim()) return;

  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_ELEVENLABS_API_KEY");
  }

  if (!voiceId) {
    throw new Error("Missing NEXT_PUBLIC_VOICE_ID");
  }

  const endpoint = `${baseUrl}/${encodeURIComponent(voiceId)}`;

  const response = await fetch(
    endpoint,
    {
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
    }
  );

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    let parsedBody = rawBody;
    try {
      parsedBody = JSON.stringify(JSON.parse(rawBody));
    } catch {
      // keep raw text body
    }
    throw new Error(`ElevenLabs error ${response.status}: ${parsedBody || "Unknown error"}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.preload = "auto";

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error("Audio playback failed"));
    };

    audio.play().catch((err) => {
      URL.revokeObjectURL(audioUrl);
      reject(err);
    });
  });
}