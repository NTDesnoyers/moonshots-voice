export type Phase = "open" | "mtp" | "moonshot" | "network" | "close";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export type VoiceEngine = "browser" | "whisper" | "realtime";

export type MtpId = "opportunity-routing" | "relationship-infra" | "dual-domain";

export type MoonshotId = "opportunity-os" | "ai-native-ninja" | "build-partner";

export type StepId =
  | "welcome"
  | "ready"
  | "rank"
  | "litmus"
  | "pick-mtp"
  | "pick-moonshot"
  | "applies"
  | "liner"
  | "flags"
  | "day-map"
  | "commit"
  | "done";

export interface Decisions {
  energy?: string;
  revalizeResidue?: string;
  load?: string;
  mtpRanking?: MtpId[];
  mtpPick?: MtpId;
  mtpLitmusNotes?: string;
  moonshotPick?: MoonshotId;
  moonshotWhy?: string;
  reApply?: string;
  afsApply?: string;
  oneLiner?: string;
  oneLiner15?: string;
  flagsNotes?: string;
  dayPriorities?: string;
  questionsToAsk?: string;
  successMetric?: string;
  openAnswers?: Record<string, string>;
  extraNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: "coach" | "you";
  text: string;
  at: number;
}

export interface SessionState {
  startedAt: number | null;
  updatedAt: number;
  phase: Phase;
  step: StepId;
  decisions: Decisions;
  messages: ChatMessage[];
  completed: boolean;
}

export interface CoachTurn {
  reply: string;
  phase: Phase;
  step: StepId;
  decisions: Decisions;
  completed: boolean;
  challenge?: boolean;
}

export interface ApiStatus {
  llm: "openai" | "anthropic" | null;
  whisper: boolean;
  tts: boolean;
  realtime: boolean;
}

export interface AgendaBlock {
  id: Phase;
  minutes: string;
  title: string;
  output: string;
}
