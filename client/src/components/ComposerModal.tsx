import { useEffect, useRef } from "react";

interface ComposerModalProps {
  open: boolean;
  value: string;
  error: string | null;
  sending: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function ComposerModal({
  open,
  value,
  error,
  sending,
  onChange,
  onClose,
  onSubmit,
}: ComposerModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(value.length, value.length);
    }, 30);

    return () => window.clearTimeout(timer);
  }, [open, value.length]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 140,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backgroundColor: "rgba(7, 10, 20, 0.66)",
        padding: "16px calc(env(safe-area-inset-right) + 12px) calc(env(safe-area-inset-bottom) + 12px) calc(env(safe-area-inset-left) + 12px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Send text to terminal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 16,
          border: "1px solid #2a2a4e",
          backgroundColor: "#10182c",
          boxShadow: "0 18px 50px rgba(0, 0, 0, 0.45)",
          overflow: "hidden",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 16px 10px",
              borderBottom: "1px solid #2a2a4e",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#e0e0e0",
              }}
            >
              Send To Terminal
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#8d97b5",
              }}
            >
              Multi-line text is supported. Submit sends the text with a trailing newline.
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Type text to send..."
              rows={7}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              style={{
                width: "100%",
                minHeight: 160,
                resize: "vertical",
                borderRadius: 12,
                border: "1px solid #31415f",
                backgroundColor: "#0b1324",
                color: "#e0e0e0",
                padding: 12,
                fontSize: 13,
                lineHeight: 1.5,
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                outline: "none",
              }}
            />
            {error && (
              <div
                style={{
                  marginTop: 10,
                  color: "#ff9b9b",
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              padding: "0 16px 16px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              style={{
                borderRadius: 10,
                border: "1px solid #3b4662",
                backgroundColor: "transparent",
                color: "#c7d0ea",
                padding: "10px 14px",
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || value.trim().length === 0}
              style={{
                borderRadius: 10,
                border: "1px solid #6ab0ff",
                backgroundColor: sending ? "#24456a" : "#2f6db3",
                color: "#f4f8ff",
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
