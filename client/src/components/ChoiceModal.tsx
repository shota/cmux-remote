import type { TerminalChoiceOption, TerminalChoicePrompt } from "../lib/terminal-choices";

interface ChoiceModalProps {
  open: boolean;
  prompt: TerminalChoicePrompt | null;
  sending: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (option: TerminalChoiceOption) => void;
}

export function ChoiceModal({
  open,
  prompt,
  sending,
  error,
  onClose,
  onSelect,
}: ChoiceModalProps) {
  if (!open || !prompt) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backgroundColor: "rgba(7, 10, 20, 0.66)",
        padding: "16px 12px calc(env(safe-area-inset-bottom) + 12px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select terminal choice"
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
        <div
          style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid #2a2a4e",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0" }}>
            {prompt.title}
          </div>
          {prompt.details.map((detail) => (
            <div
              key={detail}
              style={{ marginTop: 4, fontSize: 12, color: "#8d97b5", lineHeight: 1.4 }}
            >
              {detail}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 16,
            maxHeight: "min(60vh, 520px)",
            overflowY: "auto",
          }}
        >
          {prompt.options.map((option) => (
            <button
              key={`${option.index}-${option.token}`}
              type="button"
              disabled={sending}
              onClick={() => onSelect(option)}
              style={{
                textAlign: "left",
                borderRadius: 12,
                border: "1px solid #31415f",
                backgroundColor: "#0b1324",
                color: "#e0e0e0",
                padding: "12px 12px 10px",
                cursor: sending ? "default" : "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {option.index}. {option.label}
                </div>
                <div style={{ fontSize: 11, color: "#8fdcff", flexShrink: 0 }}>
                  {option.kind === "input" ? "input" : option.token}
                </div>
              </div>
              {option.description && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#9ca9c4",
                    lineHeight: 1.4,
                  }}
                >
                  {option.description}
                </div>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: "0 16px 10px", color: "#ff9b9b", fontSize: 12 }}>
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
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
        </div>
      </div>
    </div>
  );
}
