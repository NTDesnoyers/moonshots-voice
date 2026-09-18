import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceEngine, VoiceState } from "../types";
import { createRecognizer, requestMic, speechRecognitionSupported } from "./recognition";
import { speakBrowser, stopBrowserSpeech } from "./synthesis";
import { playTts, transcribeBlob } from "../api/client";

const SILENCE_MS = 1150;
const MIN_COMMIT = 2;

export interface DuplexVoice {
  supported: boolean;
  permission: "unknown" | "granted" | "denied";
  state: VoiceState;
  engine: VoiceEngine;
  interim: string;
  muted: boolean;
  error: string | null;
  setEngine: (engine: VoiceEngine) => void;
  setMuted: (muted: boolean) => void;
  start: () => Promise<void>;
  stop: () => void;
  speak: (text: string) => Promise<void>;
  interrupt: () => void;
  hold: (held: boolean) => void;
}

export function useDuplexVoice(onTurn: (text: string) => void, enabled: boolean): DuplexVoice {
  const [state, setState] = useState<VoiceState>("idle");
  const [engine, setEngine] = useState<VoiceEngine>("browser");
  const [interim, setInterim] = useState("");
  const [muted, setMuted] = useState(false);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(() => speechRecognitionSupported() || Boolean(navigator.mediaDevices));

  const onTurnRef = useRef(onTurn);
  onTurnRef.current = onTurn;
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wantListenRef = useRef(false);
  const mutedRef = useRef(false);
  const stateRef = useRef<VoiceState>("idle");
  const engineRef = useRef<VoiceEngine>("browser");
  const bufferRef = useRef("");
  const silenceRef = useRef<number | null>(null);
  const stopSpeakRef = useRef<(() => void) | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const holdRef = useRef(false);

  mutedRef.current = muted;
  stateRef.current = state;
  engineRef.current = engine;

  const clearSilence = () => {
    if (silenceRef.current) window.clearTimeout(silenceRef.current);
    silenceRef.current = null;
  };

  const commit = useCallback((text: string) => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    const words = cleaned.split(/\s+/).length;
    if (words < MIN_COMMIT && !/^(yes|yeah|yep|no|ready|one|two|three|1|2|3)$/i.test(cleaned)) {
      return;
    }
    bufferRef.current = "";
    setInterim("");
    onTurnRef.current(cleaned);
  }, []);

  const scheduleCommit = useCallback(() => {
    clearSilence();
    silenceRef.current = window.setTimeout(() => {
      if (mutedRef.current || holdRef.current) return;
      if (stateRef.current === "thinking" || stateRef.current === "speaking") return;
      const text = bufferRef.current;
      bufferRef.current = "";
      commit(text);
    }, SILENCE_MS);
  }, [commit]);

  const bargeIn = useCallback(() => {
    if (stateRef.current !== "speaking") return;
    stopSpeakRef.current?.();
    stopSpeakRef.current = null;
    stopBrowserSpeech();
    setState("listening");
  }, []);

  const attachRecognizer = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    const recognition = createRecognizer();
    if (!recognition) return null;
    recognition.onresult = (event) => {
      if (mutedRef.current || !wantListenRef.current || holdRef.current) return;
      if (stateRef.current === "speaking") bargeIn();
      if (stateRef.current === "thinking") return;
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalText += ` ${piece}`;
        else interimText += ` ${piece}`;
      }
      if (finalText.trim()) {
        bufferRef.current = `${bufferRef.current} ${finalText}`.replace(/\s+/g, " ").trim();
      }
      setInterim((bufferRef.current + " " + interimText).trim());
      scheduleCommit();
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setPermission("denied");
        setError("Mic permission blocked. Allow the microphone for this site, then start again.");
        wantListenRef.current = false;
        setState("idle");
        return;
      }
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(`Speech recognition: ${event.error}`);
    };
    recognition.onend = () => {
      if (wantListenRef.current && !mutedRef.current && engineRef.current === "browser") {
        try {
          recognition.start();
        } catch {
          window.setTimeout(() => {
            try {
              recognition.start();
            } catch {
              /* Chrome throws if already started */
            }
          }, 180);
        }
      }
    };
    recognitionRef.current = recognition;
    return recognition;
  }, [bargeIn, scheduleCommit]);

  const startWhisperLoop = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      if (!wantListenRef.current || mutedRef.current) return;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];
      if (blob.size < 800) {
        if (wantListenRef.current) void startWhisperLoop();
        return;
      }
      try {
        const text = await transcribeBlob(blob);
        if (text) commit(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Whisper failed");
      }
    };
    recorderRef.current = recorder;
    recorder.start();
    window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 6000);
  }, [commit]);

  const start = useCallback(async () => {
    setError(null);
    const permissionState = await requestMic();
    setPermission(permissionState === "denied" ? "denied" : "granted");
    if (permissionState === "denied") {
      setError("Mic blocked. Use the text box, or allow microphone access in the browser site settings.");
      return;
    }
    wantListenRef.current = true;
    setState("listening");
    if (engineRef.current === "whisper") {
      await startWhisperLoop();
      return;
    }
    const recognition = attachRecognizer();
    if (!recognition) {
      setError("This browser has no Speech Recognition. Use Chrome or Edge, or type instead.");
      return;
    }
    try {
      recognition.start();
    } catch {
      /* already started */
    }
  }, [attachRecognizer, startWhisperLoop]);

  const stop = useCallback(() => {
    wantListenRef.current = false;
    clearSilence();
    recognitionRef.current?.stop();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    stopSpeakRef.current?.();
    stopBrowserSpeech();
    setState("idle");
    setInterim("");
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setState("speaking");
    await new Promise<void>((resolve) => {
      const finish = () => {
        if (wantListenRef.current && !mutedRef.current) setState("listening");
        else setState("idle");
        resolve();
      };
      if (engineRef.current === "whisper") {
        const controller = new AbortController();
        stopSpeakRef.current = () => {
          controller.abort();
          finish();
        };
        void playTts(text, controller.signal).then(finish).catch(finish);
        return;
      }
      stopSpeakRef.current = speakBrowser(text, finish);
    });
  }, []);

  const interrupt = useCallback(() => {
    bargeIn();
    setInterim("");
  }, [bargeIn]);

  const hold = useCallback((held: boolean) => {
    holdRef.current = held;
    if (held) {
      clearSilence();
      setState("thinking");
    } else if (wantListenRef.current && !mutedRef.current) {
      setState("listening");
    }
  }, []);

  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  useEffect(() => {
    if (muted) {
      clearSilence();
      recognitionRef.current?.stop();
    } else if (wantListenRef.current && enabled && engine === "browser") {
      try {
        recognitionRef.current?.start();
      } catch {
        /* already started */
      }
    }
  }, [muted, enabled, engine]);

  return {
    supported,
    permission,
    state,
    engine,
    interim,
    muted,
    error,
    setEngine,
    setMuted,
    start,
    stop,
    speak,
    interrupt,
    hold,
  };
}
