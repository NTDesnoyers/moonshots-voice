import { useState } from "react";

export function Composer({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        const next = text.trim();
        if (!next) return;
        onSend(next);
        setText("");
      }}
    >
      <textarea
        value={text}
        disabled={disabled}
        placeholder="Type if the mic fails. Enter to send."
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <button className="btn primary" type="submit" disabled={disabled || !text.trim()}>
        Send
      </button>
    </form>
  );
}
