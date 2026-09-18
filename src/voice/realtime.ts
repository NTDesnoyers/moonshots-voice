import { createRealtimeSession } from "../api/client";

export interface RealtimeHandle {
  stop: () => void;
}

/**
 * Optional OpenAI Realtime WebRTC path.
 * Requires OPENAI_API_KEY on the Vite server so /api/realtime/session can mint an ephemeral token.
 * Falls back to the caller if SDP exchange fails (API shapes move).
 */
export async function startRealtimeVoice(onRemoteAudio: (stream: MediaStream) => void): Promise<RealtimeHandle> {
  const session = (await createRealtimeSession()) as {
    client_secret?: { value?: string };
    value?: string;
    model?: string;
  };
  const secret = session.client_secret?.value || session.value;
  if (!secret) throw new Error("Realtime session did not return a client secret");

  const pc = new RTCPeerConnection();
  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) onRemoteAudio(stream);
  };
  const local = await navigator.mediaDevices.getUserMedia({ audio: true });
  local.getTracks().forEach((track) => pc.addTrack(track, local));
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const model = session.model || "gpt-4o-realtime-preview";
  const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/sdp",
    },
    body: offer.sdp ?? "",
  });
  if (!sdpResponse.ok) {
    local.getTracks().forEach((track) => track.stop());
    pc.close();
    throw new Error(`Realtime SDP exchange failed (${sdpResponse.status})`);
  }
  const answer = await sdpResponse.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answer });

  return {
    stop: () => {
      local.getTracks().forEach((track) => track.stop());
      pc.close();
    },
  };
}
