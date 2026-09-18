import type { VoiceState } from "../types";

const LABELS: Record<VoiceState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export function VoiceStage({
  state,
  interim,
}: {
  state: VoiceState;
  interim: string;
}) {
  return (
    <div className="voice-stage">
      <div className={`orb ${state}`} aria-hidden="true" />
      <div className="state-label">{LABELS[state]}</div>
      <div className="interim">{interim || (state === "listening" ? "Talk when you are ready." : "")}</div>
    </div>
  );
}
