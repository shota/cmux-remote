import { useCallback, useEffect, useState, useRef } from "react";
import { Terminal } from "./components/Terminal";
import { Header } from "./components/Header";
import { Drawer, SIDEBAR_WIDTH, DESKTOP_BREAKPOINT } from "./components/Drawer";
import { StatusBar } from "./components/StatusBar";
import { ComposerModal } from "./components/ComposerModal";
import { KeyModal } from "./components/KeyModal";
import { PanePickerModal } from "./components/PanePickerModal";
import { ChoiceModal } from "./components/ChoiceModal";
import { useCmux } from "./hooks/useCmux";
import { useGesture } from "./hooks/useGesture";
import { useSwipe } from "./hooks/useSwipe";
import { findSurfaceTitle, getLatestNonEmptyLine } from "./lib/pane-preview";
import {
  parseTerminalChoices,
  type TerminalChoiceOption,
  type TerminalChoicePrompt,
} from "./lib/terminal-choices";

const POLL_INTERVAL = 1000;
const SPECIAL_KEYS = [
  { label: "Ctrl+C", keyValue: "ctrl+c", description: "Interrupt the current process." },
  { label: "Ctrl+D", keyValue: "ctrl+d", description: "Send EOF to the current shell or process." },
  { label: "Ctrl+Z", keyValue: "ctrl+z", description: "Suspend the foreground process." },
  { label: "Esc", keyValue: "escape", description: "Cancel prompts or exit modes like vim insert mode." },
  { label: "Tab", keyValue: "tab", description: "Trigger completion or move focus forward." },
  { label: "Enter", keyValue: "enter", description: "Submit the current command line." },
  { label: "Up", keyValue: "up", description: "Recall previous command history." },
  { label: "Down", keyValue: "down", description: "Move down through command history." },
  { label: "Left", keyValue: "left", description: "Move cursor left." },
  { label: "Right", keyValue: "right", description: "Move cursor right." },
] as const;

export function App() {
  const {
    status,
    workspaces,
    currentWorkspace,
    panes,
    currentPane,
    notifications,
    listWorkspaces,
    selectWorkspace,
    listPanes,
    focusPane,
    readText,
    sendText,
    sendKey,
    getTree,
    listNotifications,
    navigateWorkspace,
    navigatePane,
  } = useCmux();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keySending, setKeySending] = useState(false);
  const [termContent, setTermContent] = useState("");
  const [panePickerOpen, setPanePickerOpen] = useState(false);
  const [panePickerLoading, setPanePickerLoading] = useState(false);
  const [panePickerError, setPanePickerError] = useState<string | null>(null);
  const [choiceModalOpen, setChoiceModalOpen] = useState(false);
  const [choicePrompt, setChoicePrompt] = useState<TerminalChoicePrompt | null>(null);
  const [choiceSending, setChoiceSending] = useState(false);
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const [paneSummaries, setPaneSummaries] = useState<
    { ref: string; title: string; latestLine: string; focused: boolean }[]
  >([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const applyViewportSize = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const width = viewport?.width ?? window.innerWidth;
      document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`);
      document.documentElement.style.setProperty("--app-width", `${Math.round(width)}px`);
    };

    const syncViewportSize = () => {
      cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);

      rafId = requestAnimationFrame(() => {
        applyViewportSize();
        timeoutId = setTimeout(applyViewportSize, 250);
      });
    };

    syncViewportSize();

    const viewport = window.visualViewport;
    window.addEventListener("resize", syncViewportSize);
    window.addEventListener("orientationchange", syncViewportSize);
    window.addEventListener("pageshow", syncViewportSize);
    viewport?.addEventListener("resize", syncViewportSize);
    viewport?.addEventListener("scroll", syncViewportSize);

    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", syncViewportSize);
      window.removeEventListener("orientationchange", syncViewportSize);
      window.removeEventListener("pageshow", syncViewportSize);
      viewport?.removeEventListener("resize", syncViewportSize);
      viewport?.removeEventListener("scroll", syncViewportSize);
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (status !== "connected") return;

    listWorkspaces()
      .then(() => Promise.all([listPanes(), listNotifications()]))
      .catch((err) => console.error("[app] Init error:", err));
  }, [status, listWorkspaces, listPanes]);

  // Re-fetch panes when workspace changes
  useEffect(() => {
    if (status !== "connected" || !currentWorkspace) return;
    listPanes(currentWorkspace).catch(() => {});
  }, [status, currentWorkspace, listPanes]);

  // Poll terminal content using workspace_ref
  useEffect(() => {
    if (status !== "connected" || !currentWorkspace) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    const poll = async () => {
      try {
        const text = await readText({ workspaceRef: currentWorkspace });
        setTermContent(text);
      } catch (err) {
        console.error("[app] Poll error:", err);
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, currentWorkspace, readText]);

  // Gesture handlers
  const onSwipeUp = useCallback(() => {
    navigateWorkspace("next");
  }, [navigateWorkspace]);

  const onSwipeDown = useCallback(() => {
    navigateWorkspace("prev");
  }, [navigateWorkspace]);

  const onSwipeLeft = useCallback(() => {
    navigatePane("next");
  }, [navigatePane]);

  const onSwipeRight = useCallback(() => {
    navigatePane("prev");
  }, [navigatePane]);

  const gestureRef = useGesture({
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
  });

  const paneSwipeRef = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    pointers: 1,
  });

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const currentWs = workspaces.find((w) => w.ref === currentWorkspace);
  const currentPaneInfo = panes.find((p) => p.ref === currentPane);

  const openComposer = useCallback(() => {
    setKeyModalOpen(false);
    setPanePickerOpen(false);
    setChoiceModalOpen(false);
    setSendError(null);
    setComposerOpen(true);
  }, []);

  const handleTerminalTap = useCallback(() => {
    const prompt = parseTerminalChoices(termContent);
    if (prompt) {
      setComposerOpen(false);
      setKeyModalOpen(false);
      setPanePickerOpen(false);
      setChoiceError(null);
      setChoicePrompt(prompt);
      setChoiceModalOpen(true);
      return;
    }

    openComposer();
  }, [openComposer, termContent]);

  const openKeyModal = useCallback(() => {
    setComposerOpen(false);
    setPanePickerOpen(false);
    setChoiceModalOpen(false);
    setKeyError(null);
    setKeyModalOpen(true);
  }, []);

  const openPanePicker = useCallback(async () => {
    setComposerOpen(false);
    setKeyModalOpen(false);
    setChoiceModalOpen(false);
    setPanePickerOpen(true);
    setPanePickerLoading(true);
    setPanePickerError(null);

    try {
      const tree = await getTree();
      const summaries = await Promise.all(
        panes.map(async (pane) => {
          const title =
            findSurfaceTitle(tree, pane.selected_surface_ref) ??
            pane.selected_surface_ref ??
            pane.ref;
          let latestLine = "";

          try {
            const text = await readText({
              surfaceRef: pane.selected_surface_ref,
              workspaceRef: currentWorkspace ?? undefined,
            });
            latestLine = getLatestNonEmptyLine(text);
          } catch {}

          return {
            ref: pane.ref,
            title,
            latestLine,
            focused: pane.ref === currentPane,
          };
        })
      );

      setPaneSummaries(summaries);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPanePickerError(message);
      setPaneSummaries([]);
    } finally {
      setPanePickerLoading(false);
    }
  }, [currentPane, currentWorkspace, getTree, panes, readText]);

  const closeComposer = useCallback(() => {
    if (sending) return;
    setComposerOpen(false);
    setSendError(null);
  }, [sending]);

  const closeKeyModal = useCallback(() => {
    if (keySending) return;
    setKeyModalOpen(false);
    setKeyError(null);
  }, [keySending]);

  const closePanePicker = useCallback(() => {
    if (panePickerLoading) return;
    setPanePickerOpen(false);
    setPanePickerError(null);
  }, [panePickerLoading]);

  const closeChoiceModal = useCallback(() => {
    if (choiceSending) return;
    setChoiceModalOpen(false);
    setChoiceError(null);
  }, [choiceSending]);

  const handleSubmitComposer = useCallback(async () => {
    if (sending) return;
    const trimmed = composerText.trim();
    if (!trimmed) return;

    const payload = composerText.endsWith("\n") ? composerText : `${composerText}\n`;
    const surfaceRef = currentPaneInfo?.selected_surface_ref;
    const workspaceRef = currentWorkspace ?? undefined;

    if (!surfaceRef && !workspaceRef) {
      setSendError("No active terminal target is available.");
      return;
    }

    try {
      setSending(true);
      setSendError(null);
      await sendText({ surfaceRef, workspaceRef }, payload);

      if (workspaceRef) {
        const text = await readText({ workspaceRef });
        setTermContent(text);
      }

      setComposerText("");
      setComposerOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSendError(message);
    } finally {
      setSending(false);
    }
  }, [composerText, currentPaneInfo, currentWorkspace, readText, sendText, sending]);

  const handleSendKey = useCallback(
    async (keyValue: string) => {
      if (keySending) return;

      const surfaceRef = currentPaneInfo?.selected_surface_ref;
      const workspaceRef = currentWorkspace ?? undefined;

      if (!surfaceRef && !workspaceRef) {
        setKeyError("No active terminal target is available.");
        return;
      }

      try {
        setKeySending(true);
        setKeyError(null);
        await sendKey({ surfaceRef, workspaceRef }, keyValue);

        if (workspaceRef) {
          const text = await readText({ workspaceRef });
          setTermContent(text);
        }

        setKeyModalOpen(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setKeyError(message);
      } finally {
        setKeySending(false);
      }
    },
    [currentPaneInfo, currentWorkspace, keySending, readText, sendKey]
  );

  const handleSelectPaneFromPicker = useCallback(
    async (paneRef: string) => {
      await focusPane(paneRef, currentWorkspace ?? undefined);
      setPanePickerOpen(false);
      setPanePickerError(null);
    },
    [currentWorkspace, focusPane]
  );

  const handleSelectTerminalChoice = useCallback(
    async (option: TerminalChoiceOption) => {
      if (choiceSending) return;

      const surfaceRef = currentPaneInfo?.selected_surface_ref;
      const workspaceRef = currentWorkspace ?? undefined;
      if (!surfaceRef && !workspaceRef) {
        setChoiceError("No active terminal target is available.");
        return;
      }

      try {
        setChoiceSending(true);
        setChoiceError(null);

        const currentSelectedIndex = choicePrompt?.selectedIndex ?? null;
        const targetIndex = choicePrompt?.options.findIndex((item) => item.index === option.index) ?? -1;
        if (currentSelectedIndex !== null && currentSelectedIndex >= 0 && targetIndex >= 0) {
          const delta = targetIndex - currentSelectedIndex;
          const directionKey = delta >= 0 ? "down" : "up";
          for (let i = 0; i < Math.abs(delta); i += 1) {
            await sendKey({ surfaceRef, workspaceRef }, directionKey);
          }
          await sendKey({ surfaceRef, workspaceRef }, "enter");
        } else if (option.kind === "input") {
          await sendText({ surfaceRef, workspaceRef }, `${option.token}\n`);
        } else {
          const token = option.token;
          if (token === "esc" || token === "escape") {
            await sendKey({ surfaceRef, workspaceRef }, "escape");
          } else if (token === "enter" || token === "return") {
            await sendKey({ surfaceRef, workspaceRef }, "enter");
          } else {
            await sendText({ surfaceRef, workspaceRef }, token);
          }
        }

        if (workspaceRef) {
          const text = await readText({ workspaceRef });
          setTermContent(text);
        }

        setChoiceModalOpen(false);
        if (option.kind === "input") {
          setComposerText("");
          setComposerOpen(true);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setChoiceError(message);
      } finally {
        setChoiceSending(false);
      }
    },
    [choicePrompt, choiceSending, currentPaneInfo, currentWorkspace, readText, sendKey, sendText]
  );

  return (
    <div
      style={{
        display: "flex",
        height: "var(--app-height)",
        width: "var(--app-width)",
        paddingTop: "env(safe-area-inset-top)",
        backgroundColor: "#1a1a2e",
        color: "#e0e0e0",
        overflow: "hidden",
      }}
    >
      <Drawer
        open={drawerOpen}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        notifications={notifications}
        onSelect={(ref) => {
          selectWorkspace(ref);
        }}
        onClose={() => setDrawerOpen(false)}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          marginLeft: isDesktop ? SIDEBAR_WIDTH : 0,
          transition: "margin-left 0.2s ease-out",
          overflow: "hidden",
        }}
      >
        <Header
          workspaceName={currentWs?.title ?? null}
          onMenuToggle={() => setDrawerOpen((o) => !o)}
          onCompose={openComposer}
          onOpenKeyModal={openKeyModal}
          showMenuButton={!isDesktop}
        />

        <Terminal content={termContent} gestureRef={gestureRef} onOpenComposer={handleTerminalTap} />

        <StatusBar
          status={status}
          paneName={currentPaneInfo?.ref ?? currentPane}
          paneIndex={panes.findIndex((p) => p.ref === currentPane)}
          paneCount={panes.length}
          paneControlRef={paneSwipeRef}
          onOpenPanePicker={openPanePicker}
        />
      </div>

      <ComposerModal
        open={composerOpen}
        value={composerText}
        error={sendError}
        sending={sending}
        onChange={setComposerText}
        onClose={closeComposer}
        onSubmit={handleSubmitComposer}
      />

      <KeyModal
        open={keyModalOpen}
        sending={keySending}
        error={keyError}
        options={[...SPECIAL_KEYS]}
        onClose={closeKeyModal}
        onSelect={handleSendKey}
      />

      <PanePickerModal
        open={panePickerOpen}
        loading={panePickerLoading}
        error={panePickerError}
        panes={paneSummaries}
        onClose={closePanePicker}
        onSelect={handleSelectPaneFromPicker}
      />

      <ChoiceModal
        open={choiceModalOpen}
        prompt={choicePrompt}
        sending={choiceSending}
        error={choiceError}
        onClose={closeChoiceModal}
        onSelect={handleSelectTerminalChoice}
      />
    </div>
  );
}
