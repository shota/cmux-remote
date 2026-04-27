import type { Subprocess } from "bun";

function isEnabled(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

interface TunnelHandle {
  name: string;
  proc: Subprocess;
}

async function streamLines(
  stream: ReadableStream<Uint8Array> | null,
  onLine: (line: string) => void,
) {
  if (!stream) return;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) onLine(line);
      }
    }
    if (buf.trim()) onLine(buf);
  } catch {
    // stream closed
  }
}

function startCloudflareTunnel(port: number): TunnelHandle | null {
  const bin = process.env.CLOUDFLARED_BIN ?? "cloudflared";
  const token = process.env.CLOUDFLARE_TUNNEL_TOKEN?.trim();

  const args = token
    ? ["tunnel", "--no-autoupdate", "run", "--token", token]
    : ["tunnel", "--no-autoupdate", "--url", `http://localhost:${port}`];

  const mode = token ? "named tunnel (token)" : "quick tunnel (free)";
  console.log(`[cloudflared] starting ${mode}`);

  let proc: Subprocess;
  try {
    proc = Bun.spawn([bin, ...args], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[cloudflared] failed to spawn '${bin}': ${msg}`);
    return null;
  }

  const urlRegex = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
  let urlReported = false;
  const handleLine = (line: string) => {
    if (!urlReported) {
      const match = line.match(urlRegex);
      if (match) {
        urlReported = true;
        console.log(`[cloudflared] public URL: ${match[0]}`);
      }
    }
    console.log(`[cloudflared] ${line}`);
  };

  streamLines(proc.stdout as ReadableStream<Uint8Array>, handleLine);
  streamLines(proc.stderr as ReadableStream<Uint8Array>, handleLine);

  proc.exited.then((code) => {
    console.log(`[cloudflared] exited with code ${code}`);
  });

  return { name: "cloudflared", proc };
}

function startNgrokTunnel(port: number): TunnelHandle | null {
  const bin = process.env.NGROK_BIN ?? "ngrok";
  const token = process.env.NGROK_AUTHTOKEN?.trim();

  const args = ["http", String(port), "--log=stdout", "--log-format=json"];
  if (token) args.push("--authtoken", token);

  const mode = token ? "with authtoken" : "with system-configured authtoken (or anonymous)";
  console.log(`[ngrok] starting ${mode}`);

  let proc: Subprocess;
  try {
    proc = Bun.spawn([bin, ...args], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ngrok] failed to spawn '${bin}': ${msg}`);
    return null;
  }

  let urlReported = false;
  const handleLine = (line: string) => {
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(line);
    } catch {
      // non-JSON line, just log raw
    }

    if (!urlReported && parsed) {
      const url = typeof parsed.url === "string" ? parsed.url : null;
      const msg = typeof parsed.msg === "string" ? parsed.msg : "";
      if (url && (msg === "started tunnel" || /tunnel/i.test(msg))) {
        urlReported = true;
        console.log(`[ngrok] public URL: ${url}`);
      }
    }

    if (parsed) {
      const lvl = typeof parsed.lvl === "string" ? parsed.lvl : "info";
      const msg = typeof parsed.msg === "string" ? parsed.msg : line;
      console.log(`[ngrok:${lvl}] ${msg}`);
    } else {
      console.log(`[ngrok] ${line}`);
    }
  };

  streamLines(proc.stdout as ReadableStream<Uint8Array>, handleLine);
  streamLines(proc.stderr as ReadableStream<Uint8Array>, handleLine);

  proc.exited.then((code) => {
    console.log(`[ngrok] exited with code ${code}`);
  });

  return { name: "ngrok", proc };
}

export function startTunnels(port: number): TunnelHandle[] {
  const tunnels: TunnelHandle[] = [];

  if (isEnabled(process.env.CLOUDFLARE_TUNNEL_ENABLED)) {
    const t = startCloudflareTunnel(port);
    if (t) tunnels.push(t);
  }

  if (isEnabled(process.env.NGROK_ENABLED)) {
    const t = startNgrokTunnel(port);
    if (t) tunnels.push(t);
  }

  if (tunnels.length > 0) {
    const stop = () => {
      for (const t of tunnels) {
        try { t.proc.kill(); } catch {}
      }
    };
    process.on("SIGINT", () => { stop(); process.exit(130); });
    process.on("SIGTERM", () => { stop(); process.exit(143); });
    process.on("exit", stop);
  }

  return tunnels;
}
