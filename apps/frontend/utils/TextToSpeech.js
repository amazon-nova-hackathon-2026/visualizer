function speakWithBrowser(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    throw new Error("Speech synthesis unavailable in this browser");
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;

  return new Promise((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error("Browser speech synthesis failed"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakWithElevenLabs(text) {
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  const voiceId = process.env.NEXT_PUBLIC_VOICE_ID;
  const baseUrl =
    (process.env.NEXT_PUBLIC_BASE_URL || "https://api.elevenlabs.io/v1/text-to-speech").replace(/\/$/, "");

  if (!text || !text.trim()) return;

  if (!apiKey || !voiceId) {
    return speakWithBrowser(text);
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
    console.warn(`ElevenLabs error ${response.status}: ${parsedBody || "Unknown error"}. Falling back to browser TTS.`);
    return speakWithBrowser(text);
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
      speakWithBrowser(text).then(resolve).catch(reject);
    };

    audio.play().catch((err) => {
      URL.revokeObjectURL(audioUrl);
      console.warn("Audio playback failed for ElevenLabs response. Falling back to browser TTS.", err);
      speakWithBrowser(text).then(resolve).catch(reject);
    });
  });
}