/** Spoken announcements via the browser's built-in speech synthesis (free, offline-capable). */
export const voiceSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const v = window.speechSynthesis.getVoices();
  return v.find(x => x.lang === lang) ?? v.find(x => x.lang.startsWith(lang.split("-")[0]));
}

/** Resolves when speech ends (or immediately if unsupported). */
export function speak(text: string, lang = "en-IN"): Promise<void> {
  if (!voiceSupported()) return Promise.resolve();
  return new Promise(resolve => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.95;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

export const stopSpeaking = () => { if (voiceSupported()) window.speechSynthesis.cancel(); };
