import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";

export function Transcript({ messages }: { messages: ChatMessage[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, messages.at(-1)?.text]);

  return (
    <div className="transcript" ref={ref} aria-live="polite">
      {messages.map((message) => (
        <article key={message.id} className={`bubble ${message.role}`}>
          <span className="who">{message.role === "coach" ? "Vision" : "Nathan"}</span>
          {message.text}
        </article>
      ))}
    </div>
  );
}
