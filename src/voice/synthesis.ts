export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return ranked[0] ?? null;
}

function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name.toLowerCase();
  if (voice.lang.toLowerCase().startsWith("en")) score += 5;
  if (voice.localService) score += 1;
  if (/(samantha|google uk english|google us english|aria|jenny|natural|neural|ash|cove)/i.test(name)) {
    score += 4;
  }
  if (/english/.test(name)) score += 1;
  if (voice.default) score += 1;
  return score;
}

export function speakBrowser(text: string, onend?: () => void): () => void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanForSpeech(text));
  utterance.rate = 1.02;
  utterance.pitch = 0.95;
  utterance.lang = "en-US";
  const voice = pickVoice(synth.getVoices());
  if (voice) utterance.voice = voice;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    onend?.();
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  synth.speak(utterance);
  return () => {
    synth.cancel();
    finish();
  };
}

export function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/[_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function stopBrowserSpeech(): void {
  window.speechSynthesis.cancel();
}
