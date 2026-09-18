import type { ChatMessage } from "../types";

export function Transcript({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="transcript" aria-live="polite">
      {messages.map((message) => (
        <article key={message.id} className={`bubble ${message.role}`}>
          <span className="who">{message.role === "coach" ? "Vision" : "Nathan"}</span>
          {message.text}
        </article>
      ))}
    </div>
  );
}
