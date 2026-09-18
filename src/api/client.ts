import type { ApiStatus, ChatMessage, Decisions, Phase, StepId } from "../types";

export async function fetchStatus(): Promise<ApiStatus> {
  try {
    const res = await fetch("/api/status");
    if (!res.ok) throw new Error("status failed");
    return (await res.json()) as ApiStatus;
  } catch {
    return { llm: null, whisper: false, tts: false, realtime: false };
  }
}

export async function streamCoach(input: {
  messages: ChatMessage[];
  userText: string;
  phase: Phase;
  step: StepId;
  decisions: Decisions;
  onDelta: (chunk: string) => void;
}): Promise<{ reply: string; decisions?: Decisions; phase?: Phase; step?: StepId }> {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: input.messages.slice(-16),
      userText: input.userText,
      phase: input.phase,
      step: input.step,
      decisions: input.decisions,
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(await safeError(res));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  let meta: { decisions?: Decisions; phase?: Phase; step?: StepId } = {};

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const event = part.match(/^event: (\w+)/m)?.[1];
      const dataLine = part
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("");
      if (!dataLine) continue;
      if (event === "meta") {
        meta = JSON.parse(dataLine) as typeof meta;
        continue;
      }
      const payload = JSON.parse(dataLine) as { t?: string };
      if (payload.t) {
        reply += payload.t;
        input.onDelta(payload.t);
      }
    }
  }

  return { reply, ...meta };
}

export async function transcribeBlob(blob: Blob): Promise<string> {
  const audio = await blobToDataUrl(blob);
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio, mime: blob.type || "audio/webm" }),
  });
  if (!res.ok) throw new Error(await safeError(res));
  const json = (await res.json()) as { text?: string };
  return json.text?.trim() ?? "";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read audio"));
    reader.readAsDataURL(blob);
  });
}

export async function playTts(text: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch("/api/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new Error(await safeError(res));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  await new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.remove();
    };
    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("TTS playback failed"));
    };
    signal?.addEventListener("abort", () => {
      audio.pause();
      cleanup();
      resolve();
    });
    void audio.play().catch((err) => {
      cleanup();
      reject(err);
    });
  });
}

export async function createRealtimeSession(): Promise<unknown> {
  const res = await fetch("/api/realtime/session", { method: "POST" });
  if (!res.ok) throw new Error(await safeError(res));
  return res.json();
}

async function safeError(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { error?: string };
    return json.error || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}
