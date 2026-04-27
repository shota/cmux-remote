import { useCallback, useRef, useState } from "react";
import {
  createRpcRequest,
  parseRpcResponse,
  type CmuxNotification,
  type Pane,
  type Workspace,
} from "../lib/cmux-rpc";
import { useWebSocket, type ConnectionStatus } from "./useWebSocket";

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const RPC_TIMEOUT = 10_000;

interface SendTextTarget {
  surfaceRef?: string;
  workspaceRef?: string;
}

interface SendKeyTarget {
  surfaceRef?: string;
  workspaceRef?: string;
}

export function useCmux() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);
  const [panes, setPanes] = useState<Pane[]>([]);
  const [currentPane, setCurrentPane] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<CmuxNotification[]>([]);
  const pendingRef = useRef(new Map<string, PendingRequest>());

  const handleMessage = useCallback((data: string) => {
    try {
      const resp = parseRpcResponse(data);
      const pending = pendingRef.current.get(resp.id);
      if (pending) {
        clearTimeout(pending.timer);
        pendingRef.current.delete(resp.id);
        if (resp.error) {
          pending.reject(new Error(resp.error.message));
        } else {
          pending.resolve(resp.result);
        }
      }
    } catch (err) {
      console.error("[cmux] Failed to parse message:", err);
    }
  }, []);

  const wsUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
      : "ws://localhost:3456/ws";

  const { status, send } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
  });

  const rpc = useCallback(
    (method: string, params: Record<string, unknown> = {}): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        const req = createRpcRequest(method, params);
        const timer = setTimeout(() => {
          pendingRef.current.delete(req.id);
          reject(new Error(`RPC timeout: ${method}`));
        }, RPC_TIMEOUT);

        pendingRef.current.set(req.id, { resolve, reject, timer });
        send(JSON.stringify(req));
      });
    },
    [send]
  );

  const listWorkspaces = useCallback(async () => {
    const result = (await rpc("workspace.list")) as { workspaces: Workspace[] };
    const wsList = result.workspaces ?? [];
    setWorkspaces(wsList);
    const active = wsList.find((w) => w.selected);
    if (active) setCurrentWorkspace(active.ref);
    return wsList;
  }, [rpc]);

  const selectWorkspace = useCallback(
    async (ref: string) => {
      // PWA側の表示切替のみ。ローカルcmuxのフォーカスは変更しない。
      setCurrentWorkspace(ref);
      setPanes([]);
      setCurrentPane(null);
    },
    []
  );

  const listPanes = useCallback(async (workspaceRef?: string) => {
    const params: Record<string, unknown> = {};
    // cmux socket RPC expects this field name, but accepts workspace refs as values.
    if (workspaceRef) params.workspace_id = workspaceRef;
    const result = (await rpc("pane.list", params)) as { panes: Pane[] };
    const paneList = result.panes ?? [];
    setPanes(paneList);
    const active = paneList.find((p) => p.focused);
    setCurrentPane(active?.ref ?? paneList[0]?.ref ?? null);
    return paneList;
  }, [rpc]);

  const focusPane = useCallback(
    async (paneRef: string, workspaceRef?: string) => {
      const params: Record<string, unknown> = { pane_ref: paneRef };
      if (workspaceRef) params.workspace_ref = workspaceRef;
      await rpc("pane.focus", params);
      setCurrentPane(paneRef);
    },
    [rpc]
  );

  const readText = useCallback(
    async ({ surfaceRef, workspaceRef }: SendTextTarget = {}): Promise<string> => {
      const params: Record<string, unknown> = {};
      if (surfaceRef) params.surface_ref = surfaceRef;
      else if (workspaceRef) params.workspace_ref = workspaceRef;
      const result = (await rpc("surface.read_text", params)) as { text: string };
      return result.text ?? "";
    },
    [rpc]
  );

  const sendText = useCallback(
    async ({ surfaceRef, workspaceRef }: SendTextTarget, text: string) => {
      const params: Record<string, unknown> = { text };
      if (surfaceRef) params.surface_ref = surfaceRef;
      else if (workspaceRef) params.workspace_ref = workspaceRef;
      await rpc("surface.send_text", params);
    },
    [rpc]
  );

  const sendKey = useCallback(
    async ({ surfaceRef, workspaceRef }: SendKeyTarget, key: string) => {
      const params: Record<string, unknown> = { key };
      if (surfaceRef) params.surface_ref = surfaceRef;
      else if (workspaceRef) params.workspace_ref = workspaceRef;
      await rpc("surface.send_key", params);
    },
    [rpc]
  );

  const getTree = useCallback(async () => {
    return await rpc("system.tree");
  }, [rpc]);

  const listNotifications = useCallback(async () => {
    const result = (await rpc("notification.list")) as { notifications: CmuxNotification[] };
    const list = result.notifications ?? [];
    setNotifications(list);
    return list;
  }, [rpc]);

  const navigateWorkspace = useCallback(
    async (direction: "next" | "prev") => {
      if (workspaces.length === 0) return;
      const idx = workspaces.findIndex((w) => w.ref === currentWorkspace);
      const nextIdx =
        direction === "next"
          ? (idx + 1) % workspaces.length
          : (idx - 1 + workspaces.length) % workspaces.length;
      const target = workspaces[nextIdx];
      if (target) await selectWorkspace(target.ref);
    },
    [workspaces, currentWorkspace, selectWorkspace]
  );

  const navigatePane = useCallback(
    async (direction: "next" | "prev") => {
      if (panes.length === 0) return;
      const idx = panes.findIndex((p) => p.ref === currentPane);
      if (idx === -1) {
        const target = direction === "next" ? panes[0] : panes[panes.length - 1];
        if (target) await focusPane(target.ref, currentWorkspace ?? undefined);
        return;
      }
      const nextIdx =
        direction === "next"
          ? (idx + 1) % panes.length
          : (idx - 1 + panes.length) % panes.length;
      const target = panes[nextIdx];
      if (target) await focusPane(target.ref, currentWorkspace ?? undefined);
    },
    [panes, currentPane, currentWorkspace, focusPane]
  );

  return {
    status: status as ConnectionStatus,
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
  };
}
