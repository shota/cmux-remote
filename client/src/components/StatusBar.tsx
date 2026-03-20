import type { ConnectionStatus } from "../hooks/useWebSocket";

interface StatusBarProps {
  status: ConnectionStatus;
  paneName: string | null;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; color: string }
> = {
  connected: { label: "Connected", color: "#4caf50" },
  connecting: { label: "Connecting...", color: "#ff9800" },
  disconnected: { label: "Disconnected", color: "#f44336" },
};

export function StatusBar({ status, paneName }: StatusBarProps) {
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
      <span>{paneName ?? ""}</span>
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
