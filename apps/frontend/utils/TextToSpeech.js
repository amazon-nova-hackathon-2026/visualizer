export async function speakWithElevenLabs(text) {
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  const voiceId = process.env.NEXT_PUBLIC_VOICE_ID;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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
    const err = await response.json().catch(() => ({}));
    console.log("ElevenLabs error body:", JSON.stringify(err));
    throw new Error(`ElevenLabs error ${response.status}: ${JSON.stringify(err)}`);
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