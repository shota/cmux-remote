interface KeyOption {
  label: string;
  keyValue: string;
  description: string;
}

interface KeyModalProps {
  open: boolean;
  sending: boolean;
  error: string | null;
  options: KeyOption[];
  onClose: () => void;
  onSelect: (keyValue: string) => void;
}

export function KeyModal({
  open,
  sending,
  error,
  options,
  onClose,
  onSelect,
}: KeyModalProps) {
  if (!open) return null;

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
        aria-label="Send special key"
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
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#e0e0e0",
            }}
          >
            Send Special Key
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: "#8d97b5",
            }}
          >
            Send control keys and navigation keys that are awkward to type from the popup composer.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            padding: 16,
          }}
        >
          {options.map((option) => (
            <button
              key={option.keyValue}
              type="button"
              disabled={sending}
              onClick={() => onSelect(option.keyValue)}
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
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {option.label}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "#8d97b5",
                  lineHeight: 1.4,
                }}
              >
                {option.description}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              padding: "0 16px 10px",
              color: "#ff9b9b",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 16px 16px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#8d97b5",
            }}
          >
            {sending ? "Sending key..." : "Choose a key to send immediately."}
          </div>
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
