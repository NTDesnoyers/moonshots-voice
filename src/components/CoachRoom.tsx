import { useEffect, useMemo, useRef, useState } from "react";
import { fetchStatus, streamCoach } from "../api/client";
import { nextCoachTurn, openingLine } from "../coach/scripted";
import { AGENDA } from "../content/brief";
import { downloadMarkdown } from "../session/exportMarkdown";
import { createId } from "../session/store";
import type { ApiStatus, MoonshotId, MtpId, Phase, SessionState, StepId } from "../types";
import { useDuplexVoice } from "../voice/useDuplexVoice";
import { startRealtimeVoice, type RealtimeHandle } from "../voice/realtime";
import { AgendaRail } from "./AgendaRail";
import { Composer } from "./Composer";
import { MicHelp } from "./MicHelp";
import { NotesPanel } from "./NotesPanel";
import { OptionCards } from "./OptionCards";
import { Transcript } from "./Transcript";
import { VoiceStage } from "./VoiceStage";

const FIRST_STEP: Record<Phase, StepId> = {
  open: "welcome",
  mtp: "rank",
  moonshot: "pick-moonshot",
  network: "liner",
  close: "day-map",
};

export function CoachRoom({
  session,
  setSession,
  onReset,
}: {
  session: SessionState;
  setSession: (session: SessionState) => void;
  onReset: () => void;
}) {
  const [status, setStatus] = useState<ApiStatus>({ llm: null, whisper: false, tts: false, realtime: false });
  const [busy, setBusy] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [chromeHint, setChromeHint] = useState(false);
  const [realtimeOn, setRealtimeOn] = useState(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const realtimeRef = useRef<RealtimeHandle | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const openedRef = useRef(false);
  const busyRef = useRef(false);
  const sessionRef = useRef(session);
  const speakRef = useRef<(text: string) => Promise<void>>(async () => undefined);
  const holdRef = useRef<(held: boolean) => void>(() => undefined);
  sessionRef.current = session;

  const handleTurn = async (text: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const current = sessionRef.current;
    const userMessage = { id: createId(), role: "you" as const, text, at: Date.now() };
    const scripted = nextCoachTurn(current, text);
    let next: SessionState = {
      ...current,
      messages: [...current.messages, userMessage],
      phase: scripted.phase,
      step: scripted.step,
      decisions: scripted.decisions,
      completed: scripted.completed,
    };
    setSession(next);
    setBusy(true);
    holdRef.current(true);
    let reply = scripted.reply;

    if (status.llm) {
      try {
        let streamed = "";
        const coachId = createId();
        setSession({
          ...next,
          messages: [...next.messages, { id: coachId, role: "coach", text: "", at: Date.now() }],
        });
        const result = await streamCoach({
          messages: next.messages,
          userText: text,
          phase: scripted.phase,
          step: scripted.step,
          decisions: scripted.decisions,
          onDelta: (chunk) => {
            streamed += chunk;
            setSession({
              ...next,
              messages: [...next.messages, { id: coachId, role: "coach", text: streamed, at: Date.now() }],
            });
          },
        });
        reply = result.reply || streamed || scripted.reply;
        next = {
          ...next,
          messages: [...next.messages, { id: coachId, role: "coach", text: reply, at: Date.now() }],
        };
        setSession(next);
        await speakRef.current(reply);
        holdRef.current(false);
        busyRef.current = false;
        setBusy(false);
        return;
      } catch {
        reply = scripted.reply;
      }
    }

    const coachMessage = { id: createId(), role: "coach" as const, text: reply, at: Date.now() };
    next = { ...next, messages: [...next.messages, coachMessage] };
    setSession(next);
    await speakRef.current(reply);
    holdRef.current(false);
    busyRef.current = false;
    setBusy(false);
  };

  const voice = useDuplexVoice((text) => {
    void handleTurn(text);
  }, Boolean(session.startedAt));

  speakRef.current = voice.speak;
  holdRef.current = voice.hold;

  useEffect(() => {
    void fetchStatus().then(setStatus);
    const chromeish = /Chrome|Edg|Chromium/i.test(navigator.userAgent) && !/OPR|Opera/i.test(navigator.userAgent);
    setChromeHint(!chromeish);
  }, []);

  useEffect(() => {
    if (!session.startedAt || session.messages.length || openedRef.current) return;
    openedRef.current = true;
    const opener = openingLine();
    setSession({
      ...session,
      messages: [{ id: createId(), role: "coach", text: opener, at: Date.now() }],
    });
    void (async () => {
      await voice.start();
      await voice.speak(opener);
    })();
  }, [session, setSession, voice]);

  useEffect(() => {
    return () => {
      realtimeRef.current?.stop();
    };
  }, []);

  const displayState = busy ? "thinking" : voice.state;
  const phaseTitle = useMemo(
    () => AGENDA.find((block) => block.id === session.phase)?.title ?? "Session",
    [session.phase],
  );

  const jump = (phase: Phase) => {
    setSession({
      ...session,
      phase,
      step: FIRST_STEP[phase],
      completed: phase === "close" ? session.completed : false,
    });
  };

  const pickMtp = (id: MtpId) => {
    const spoken =
      id === "opportunity-routing"
        ? "I pick option 1 opportunity routing"
        : id === "relationship-infra"
          ? "I pick option 2 relationship infrastructure"
          : "I pick option 3 dual-domain";
    void handleTurn(spoken);
  };

  const pickMoonshot = (id: MoonshotId) => {
    const spoken =
      id === "opportunity-os"
        ? "I pick moonshot 1 Opportunity OS"
        : id === "ai-native-ninja"
          ? "I pick moonshot 2 AI-Native Ninja"
          : "I pick moonshot 3 build-partner";
    void handleTurn(spoken);
  };

  const toggleRealtime = async () => {
    setRealtimeError(null);
    if (realtimeOn) {
      realtimeRef.current?.stop();
      realtimeRef.current = null;
      setRealtimeOn(false);
      return;
    }
    try {
      const handle = await startRealtimeVoice((stream) => {
        if (!remoteAudioRef.current) {
          remoteAudioRef.current = new Audio();
          remoteAudioRef.current.autoplay = true;
        }
        remoteAudioRef.current.srcObject = stream;
      });
      realtimeRef.current = handle;
      setRealtimeOn(true);
    } catch (error) {
      setRealtimeError(error instanceof Error ? error.message : "Realtime failed");
    }
  };

  return (
    <div className="room">
      <AgendaRail phase={session.phase} onJump={jump} />
      <section className="panel stage">
        <div className="topbar">
          <div>
            <div className="kicker">
              {phaseTitle}
              <span>Step {session.step}</span>
            </div>
            <h2>Duplex floor</h2>
            <div className="meta">Listen continuously. Interrupt anytime. Type if needed.</div>
          </div>
          <div className="cta-row">
            <button className="btn mobile-notes-toggle" onClick={() => setNotesOpen((value) => !value)}>
              Card
            </button>
            <button className="btn" onClick={() => voice.setMuted(!voice.muted)}>
              {voice.muted ? "Unmute" : "Mute"}
            </button>
            <button className="btn" onClick={voice.interrupt}>
              Interrupt
            </button>
          </div>
        </div>
        {chromeHint ? (
          <div className="banner">Chrome or Edge gives the most reliable duplex speech. Text always works.</div>
        ) : null}
        <VoiceStage state={displayState} interim={voice.interim} />
        <div className="controls">
          {voice.state === "idle" ? (
            <button className="btn primary" onClick={() => void voice.start()}>
              Start listening
            </button>
          ) : (
            <button className="btn" onClick={voice.stop}>
              Stop voice
            </button>
          )}
          {status.whisper ? (
            <button
              className="btn"
              onClick={() => voice.setEngine(voice.engine === "whisper" ? "browser" : "whisper")}
            >
              {voice.engine === "whisper" ? "Using Whisper" : "Upgrade: Whisper"}
            </button>
          ) : null}
          {status.realtime ? (
            <button className="btn" onClick={() => void toggleRealtime()}>
              {realtimeOn ? "Realtime on" : "Upgrade: Realtime"}
            </button>
          ) : null}
        </div>
        <MicHelp error={voice.error || realtimeError} permission={voice.permission} supported={voice.supported} />
        <OptionCards
          phase={session.phase}
          mtpPick={session.decisions.mtpPick}
          moonshotPick={session.decisions.moonshotPick}
          onMtp={pickMtp}
          onMoonshot={pickMoonshot}
        />
        <Transcript messages={session.messages} />
        <Composer disabled={busy} onSend={(text) => void handleTurn(text)} />
      </section>
      <NotesPanel
        decisions={session.decisions}
        collapsed={!notesOpen}
        onExport={() => downloadMarkdown(session)}
        onReset={onReset}
      />
    </div>
  );
}
