interface HeaderProps {
  workspaceName: string | null;
  onMenuToggle: () => void;
  onCompose: () => void;
  onOpenKeyModal: () => void;
  showMenuButton?: boolean;
}

export function Header({
  workspaceName,
  onMenuToggle,
  onCompose,
  onOpenKeyModal,
  showMenuButton = true,
}: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        height: 44,
        padding: "0 12px",
        backgroundColor: "#16213e",
        color: "#e0e0e0",
        borderBottom: "1px solid #2a2a4e",
        flexShrink: 0,
      }}
    >
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          aria-label="Menu"
          style={{
            background: "none",
            border: "none",
            color: "#e0e0e0",
            fontSize: 22,
            padding: "4px 8px",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          &#9776;
        </button>
      )}
      <span
        style={{
          flex: 1,
          marginLeft: showMenuButton ? 8 : 4,
          fontSize: 15,
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {workspaceName ?? "cmux Remote"}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onOpenKeyModal}
          aria-label="Send special key"
          style={{
            background: "none",
            border: "1px solid #40506f",
            borderRadius: 8,
            color: "#e0e0e0",
            fontSize: 13,
            padding: "6px 10px",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          Key
        </button>
        <button
          onClick={onCompose}
          aria-label="Send text"
          style={{
            background: "none",
            border: "1px solid #40506f",
            borderRadius: 8,
            color: "#e0e0e0",
            fontSize: 13,
            padding: "6px 10px",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          Send
        </button>
      </div>
    </header>
  );
}
