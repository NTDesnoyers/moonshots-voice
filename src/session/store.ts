import type { SessionState } from "../types";

export const STORAGE_KEY = "moonshots-prep-coach-v1";

export function emptySession(): SessionState {
  return {
    startedAt: null,
    updatedAt: Date.now(),
    phase: "open",
    step: "welcome",
    decisions: {},
    messages: [],
    completed: false,
  };
}

export function loadSession(): SessionState {
  if (typeof localStorage === "undefined") return emptySession();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as SessionState;
    if (!parsed || typeof parsed !== "object") return emptySession();
    return {
      ...emptySession(),
      ...parsed,
      decisions: parsed.decisions ?? {},
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return emptySession();
  }
}

export function saveSession(session: SessionState): void {
  if (typeof localStorage === "undefined") return;
  const next = { ...session, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearSession(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
