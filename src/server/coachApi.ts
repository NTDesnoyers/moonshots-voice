import type { IncomingMessage, ServerResponse } from "node:http";
import { buildRealtimeInstructions, buildSystemPrompt } from "../coach/systemPrompt";
import type { ChatMessage, Decisions, Phase, StepId } from "../types";

type Env = Record<string, string>;

interface CoachBody {
  messages?: ChatMessage[];
  userText?: string;
  phase?: Phase;
  step?: StepId;
  decisions?: Decisions;
}

export function createCoachApiMiddleware(env: Env) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? "";
    if (!url.startsWith("/api/")) {
      next();
      return;
    }

    try {
      if (req.method === "GET" && url.startsWith("/api/status")) {
        json(res, 200, status(env));
        return;
      }
      if (req.method === "POST" && url.startsWith("/api/coach")) {
        const body = (await readJson(req)) as CoachBody;
        await streamCoach(env, body, res);
        return;
      }
      if (req.method === "POST" && url.startsWith("/api/transcribe")) {
        const body = (await readJson(req)) as { audio?: string; mime?: string };
        const text = await transcribe(env, body.audio ?? "", body.mime);
        json(res, 200, { text });
        return;
      }
      if (req.method === "POST" && url.startsWith("/api/speak")) {
        const body = (await readJson(req)) as { text?: string };
        await speak(env, body.text ?? "", res);
        return;
      }
      if (req.method === "POST" && url.startsWith("/api/realtime/session")) {
        const session = await realtimeSession(env);
        json(res, 200, session);
        return;
      }
      json(res, 404, { error: "Not found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";
      if (!res.headersSent) json(res, 500, { error: message });
      else res.end();
    }
  };
}

function status(env: Env) {
  const openai = Boolean(env.OPENAI_API_KEY);
  const anthropic = Boolean(env.ANTHROPIC_API_KEY);
  return {
    llm: openai ? "openai" : anthropic ? "anthropic" : null,
    whisper: openai,
    tts: openai,
    realtime: openai,
  };
}

async function streamCoach(env: Env, body: CoachBody, res: ServerResponse) {
  const openai = env.OPENAI_API_KEY;
  const anthropic = env.ANTHROPIC_API_KEY;
  if (!openai && !anthropic) {
    json(res, 400, { error: "No LLM key. Scripted coach is used in the browser." });
    return;
  }

  const system = buildSystemPrompt({
    phase: body.phase ?? "open",
    step: body.step ?? "welcome",
    decisions: body.decisions ?? {},
  });
  const history = (body.messages ?? []).map((message) => ({
    role: message.role === "coach" ? "assistant" : "user",
    content: message.text,
  }));
  history.push({ role: "user", content: body.userText ?? "" });

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  if (openai) {
    await streamOpenAI(env, system, history, res);
  } else {
    await streamAnthropic(env, system, history, res);
  }
  res.write(`event: meta\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  res.end();
}

async function streamOpenAI(
  env: Env,
  system: string,
  history: Array<{ role: string; content: string }>,
  res: ServerResponse,
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      stream: true,
      temperature: 0.5,
      messages: [{ role: "system", content: system }, ...history],
    }),
  });
  if (!response.ok || !response.body) {
    throw new Error(await readApiError(response));
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const chunk = json.choices?.[0]?.delta?.content;
        if (chunk) res.write(`event: token\ndata: ${JSON.stringify({ t: chunk })}\n\n`);
      } catch {
        /* ignore keepalives */
      }
    }
  }
}

async function streamAnthropic(
  env: Env,
  system: string,
  history: Array<{ role: string; content: string }>,
  res: ServerResponse,
) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 500,
      stream: true,
      system,
      messages: history.map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content,
      })),
    }),
  });
  if (!response.ok || !response.body) {
    throw new Error(await readApiError(response));
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      try {
        const json = JSON.parse(trimmed.slice(5).trim()) as {
          type?: string;
          delta?: { text?: string };
        };
        const chunk = json.delta?.text;
        if (chunk) res.write(`event: token\ndata: ${JSON.stringify({ t: chunk })}\n\n`);
      } catch {
        /* ignore */
      }
    }
  }
}

async function transcribe(env: Env, dataUrl: string, mime?: string): Promise<string> {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY required for Whisper");
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const bytes = Buffer.from(base64, "base64");
  const type = mime || "audio/webm";
  const form = new FormData();
  form.append("model", env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
  form.append("file", new Blob([bytes], { type }), `speech.${type.includes("mp4") ? "mp4" : "webm"}`);
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const json = (await response.json()) as { text?: string };
  return json.text ?? "";
}

async function speak(env: Env, text: string, res: ServerResponse) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY required for TTS");
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: env.OPENAI_TTS_VOICE || "ash",
      input: text,
      format: "mp3",
    }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const buf = Buffer.from(await response.arrayBuffer());
  res.writeHead(200, { "Content-Type": "audio/mpeg", "Content-Length": buf.length });
  res.end(buf);
}

async function realtimeSession(env: Env) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY required for Realtime");
  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview",
      voice: env.OPENAI_TTS_VOICE || "ash",
      instructions: buildRealtimeInstructions(),
    }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json();
}

function json(res: ServerResponse, statusCode: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function readApiError(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { error?: { message?: string } | string };
    if (typeof json.error === "string") return json.error;
    if (json.error?.message) return json.error.message;
  } catch {
    /* ignore */
  }
  return `${response.status} ${response.statusText}`;
}
