interface PaneSummary {
  ref: string;
  title: string;
  latestLine: string;
  focused: boolean;
}

interface PanePickerModalProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  panes: PaneSummary[];
  onClose: () => void;
  onSelect: (paneRef: string) => void;
}

export function PanePickerModal({
  open,
  loading,
  error,
  panes,
  onClose,
  onSelect,
}: PanePickerModalProps) {
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
        aria-label="Select pane"
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
            Select Pane
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: "#8d97b5",
            }}
          >
            Tap a pane to switch. Swipe left or right on the footer for quick navigation.
          </div>
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
          {loading && (
            <div style={{ color: "#8d97b5", fontSize: 13 }}>
              Loading pane previews...
            </div>
          )}

          {!loading && panes.length === 0 && !error && (
            <div style={{ color: "#8d97b5", fontSize: 13 }}>
              No panes available.
            </div>
          )}

          {panes.map((pane) => (
            <button
              key={pane.ref}
              type="button"
              onClick={() => onSelect(pane.ref)}
              style={{
                textAlign: "left",
                borderRadius: 12,
                border: pane.focused ? "1px solid #6ab0ff" : "1px solid #31415f",
                backgroundColor: pane.focused ? "#13233f" : "#0b1324",
                color: "#e0e0e0",
                padding: "12px 12px 10px",
                cursor: "pointer",
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
                  {pane.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: pane.focused ? "#8fdcff" : "#7083a6",
                    flexShrink: 0,
                  }}
                >
                  {pane.ref}
                </div>
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "#9ca9c4",
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {pane.latestLine || "No recent output"}
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
            justifyContent: "flex-end",
            padding: "0 16px 16px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
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
