import type { ConnectionStatus } from "../hooks/useWebSocket";

interface StatusBarProps {
  status: ConnectionStatus;
  paneName: string | null;
  paneIndex: number;
  paneCount: number;
  paneControlRef: (el: HTMLElement | null) => void;
  onOpenPanePicker: () => void;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; color: string }
> = {
  connected: { label: "Connected", color: "#4caf50" },
  connecting: { label: "Connecting...", color: "#ff9800" },
  disconnected: { label: "Disconnected", color: "#f44336" },
};

export function StatusBar({
  status,
  paneName,
  paneIndex,
  paneCount,
  paneControlRef,
  onOpenPanePicker,
}: StatusBarProps) {
  const config = STATUS_CONFIG[status];

  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 28,
        padding: "0 12px",
        backgroundColor: "#16213e",
        borderTop: "1px solid #2a2a4e",
        fontSize: 12,
        color: "#888",
        flexShrink: 0,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <button
        type="button"
        ref={paneControlRef}
        onClick={onOpenPanePicker}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "none",
          background: "transparent",
          color: "#c1c8d8",
          minWidth: 0,
          padding: 0,
          cursor: "pointer",
          touchAction: "pan-x",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {paneName ?? ""}
        </span>
        {paneCount > 1 && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            {Array.from({ length: paneCount }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: i === paneIndex ? "#e0e0e0" : "#444",
                  display: "inline-block",
                }}
              />
            ))}
          </span>
        )}
      </button>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: config.color,
            display: "inline-block",
          }}
        />
        {config.label}
      </span>
    </footer>
  );
}
