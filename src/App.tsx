import { useCallback, useEffect, useState } from "react";
import { CoachRoom } from "./components/CoachRoom";
import { Landing } from "./components/Landing";
import { clearSession, emptySession, loadSession, saveSession } from "./session/store";
import type { SessionState } from "./types";

export default function App() {
  const [session, setSessionState] = useState<SessionState>(() => loadSession());
  const [mode, setMode] = useState<"landing" | "room">(() => (session.startedAt && session.messages.length ? "landing" : "landing"));

  const setSession = useCallback((next: SessionState) => {
    const stamped = { ...next, updatedAt: Date.now() };
    setSessionState(stamped);
    saveSession(stamped);
  }, []);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const start = (resume: boolean) => {
    if (resume && session.startedAt) {
      setMode("room");
      return;
    }
    const fresh = { ...emptySession(), startedAt: Date.now() };
    setSession(fresh);
    setMode("room");
  };

  const reset = () => {
    clearSession();
    setSession(emptySession());
    setMode("landing");
  };

  return (
    <div className="app-shell">
      {mode === "landing" ? (
        <Landing saved={session} onStart={() => start(false)} onResume={() => start(true)} />
      ) : (
        <CoachRoom session={session} setSession={setSession} onReset={reset} />
      )}
    </div>
  );
}
