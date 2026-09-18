# Moonshots Prep Coach

Duplex voice coaching for **Nathan Desnoyers** before **Moonshots Summit** (Fri Sep 25, 2026, Los Angeles).

A single page in Chrome or Edge. The coach listens continuously, talks back, and writes locks onto a session card you can download as Markdown. No account. No API key required.

## What you walk out with

1. Warm open and agenda
2. Ranked MTP (three drafts from the prep brief) and a working #1
3. Personal moonshot plus 90-day RE and AFS applies
4. Networking one-liner and a Revalize-shaped green / red filter
5. Closing capture: on-screen notes + `.md` download

Ground truth lives in [`content/prep-brief.md`](content/prep-brief.md) and [`content/solve-everything.md`](content/solve-everything.md). The coach will not invent a biography beyond those files. Personal MTP stays distinct from the AFS firm MTP.

## Run locally

Needs Node 20+.

```bash
npm i
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm test          # coach + export tests
npm run build     # typecheck + production bundle
npm run preview   # serve the bundle
```

## Voice (duplex)

Default path uses the **browser Web Speech API**:

- `SpeechRecognition` with `continuous` + interim results
- `speechSynthesis` for spoken replies
- Silence commits a turn; talking over the coach **barges in** (TTS stops, listening continues)
- Mute, interrupt, and a text box are always available

**Use Chrome or Edge.** Safari and Firefox do not implement Speech Recognition well enough for a continuous loop. Allow the microphone when the browser asks. If the lock icon by the URL shows the mic blocked: Site settings → Microphone → Allow, then hit **Start listening**. On a phone, Chrome for Android is the realistic path; iOS Safari will fall back to typing.

`localhost` does not need HTTPS for the mic. A deployed origin does.

## Optional upgrade (API keys)

The scripted coach is useful without keys. If you want streamed LLM replies or higher-quality audio, copy [`.env.example`](.env.example) to `.env` and restart Vite.

| Variable | Effect |
|---|---|
| `OPENAI_API_KEY` | Streamed coach (`POST /api/coach`), Whisper (`/api/transcribe`), TTS (`/api/speak`), Realtime session mint (`/api/realtime/session`) |
| `ANTHROPIC_API_KEY` | Streamed coach if OpenAI is absent |
| `OPENAI_MODEL` | Chat model (default `gpt-4o-mini`) |
| `ANTHROPIC_MODEL` | Chat model (default `claude-sonnet-4-5`) |
| `OPENAI_REALTIME_MODEL` | Realtime model |
| `OPENAI_TTS_VOICE` | TTS / Realtime voice (default `ash`) |

Keys stay on the Vite server. They are not prefixed with `VITE_`, so they are not bundled into the browser.

When a key is present, the session UI shows **Upgrade: Whisper** and **Upgrade: Realtime**. Realtime uses an ephemeral token from `/api/realtime/session` plus WebRTC against `api.openai.com`. If that exchange fails (API shapes move), the browser voice loop is still the default.

## Architecture

- Vite + React + TypeScript, one page, `localStorage` persistence (`moonshots-prep-coach-v1`)
- Structured brief in `src/content/brief.ts` and Solve Everything altitude in `src/content/solve.ts`
- Scripted / branching coach in `src/coach/scripted.ts` (always used for agenda + decision locks)
- Optional LLM rewrite of the spoken turn via `src/server/coachApi.ts` mounted as Vite middleware
- No auth, no accounts

## Deploy

Static-ish: `npm run build` then host `dist/`. Browser voice works anywhere. Optional LLM / Whisper / Realtime need a host that runs the Vite preview server or any Node process that mounts the same `/api` middleware, plus the env vars above.

## Tests

`src/coach/scripted.test.ts` walks the full agenda in text and asserts MTP, moonshot, applies, one-liner, and close locks. That is the no-mic proof the session is complete.
