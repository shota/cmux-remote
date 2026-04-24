export interface TerminalChoiceOption {
  index: number;
  label: string;
  description: string;
  token: string;
  kind: "send" | "input";
  selected: boolean;
}

export interface TerminalChoicePrompt {
  title: string;
  details: string[];
  options: TerminalChoiceOption[];
  selectedIndex: number | null;
}

const OPTION_PATTERN = /^\s*[❯›>]?\s*(\d+)\.\s+(.+?)(?:\s+\(([^()]+)\))?\s*$/;
const DIVIDER_PATTERN = /^[\u2500-\u257F\u23AF\u2015\u2014╭╮╰╯│─├┤┬┴┼┌┐└┘]+\s*$/;
const CONTINUATION_PATTERN = /^\s{3,}\S/;
const FOOTER_HINT_PATTERN =
  /(?:press\s+(?:enter|return)|(?:enter|return)\s+to\s+(?:select|confirm)|(?:↑\/↓|up\/down)\s+to\s+navigate|esc\s+to\s+cancel)/i;
const INPUT_OPTION_PATTERN = /^(?:type something|chat about this)\b/i;
const RECENT_WINDOW = 16;

function isIgnorableLine(line: string): boolean {
  const trimmed = line.trim();
  return !trimmed || DIVIDER_PATTERN.test(trimmed);
}

export function parseTerminalChoices(content: string): TerminalChoicePrompt | null {
  const lines = content.split("\n").map((line) => line.trimEnd());
  const allOptions: Array<TerminalChoiceOption & { lineIndex: number }> = [];

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i]?.match(OPTION_PATTERN);
    if (!match) continue;

    const index = Number(match[1]);
    const label = match[2]?.trim() ?? "";
    const token = (match[3]?.trim() || String(index)).toLowerCase();
    const kind: "send" | "input" = INPUT_OPTION_PATTERN.test(label) ? "input" : "send";
    const selected = /^\s*[❯›>]/.test(lines[i] ?? "");

    let description = "";
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j] ?? "";
      if (OPTION_PATTERN.test(next) || DIVIDER_PATTERN.test(next)) break;
      if (CONTINUATION_PATTERN.test(next)) {
        description = next.trim();
        break;
      }
      if (next.trim()) break;
      j += 1;
    }

    allOptions.push({ index, label, description, token, kind, lineIndex: i, selected });
  }

  if (allOptions.length < 2) return null;

  const lastOption = allOptions[allOptions.length - 1];
  if (!lastOption) return null;
  if ((lines.length - 1) - lastOption.lineIndex > RECENT_WINDOW) return null;

  const cluster: Array<TerminalChoiceOption & { lineIndex: number }> = [lastOption];
  for (let i = allOptions.length - 2; i >= 0; i -= 1) {
    const current = allOptions[i];
    const next = cluster[0];
    if (!current || !next) continue;
    if (next.lineIndex - current.lineIndex > 3) break;
    cluster.unshift(current);
  }

  if (cluster.length < 2) return null;

  const firstOptionIndex = cluster[0]?.lineIndex ?? -1;
  const lastOptionIndex = cluster[cluster.length - 1]?.lineIndex ?? -1;
  if (firstOptionIndex < 0 || lastOptionIndex < 0) return null;

  const details: string[] = [];
  let title = "Select Option";
  for (let i = firstOptionIndex - 1; i >= 0; i -= 1) {
    const line = lines[i] ?? "";
    if (isIgnorableLine(line)) {
      if (details.length > 0) break;
      continue;
    }
    details.unshift(line.trim());
    if (details.length >= 3) break;
  }

  if (details.length > 0) {
    title = details[0] ?? title;
  }

  const footerDetails: string[] = [];
  for (let i = lastOptionIndex + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (isIgnorableLine(line)) continue;
    if (OPTION_PATTERN.test(line)) continue;
    if (!FOOTER_HINT_PATTERN.test(line.trim())) return null;
    footerDetails.push(line.trim());
    if (footerDetails.length >= 2) break;
  }

  return {
    title,
    details: [...details.slice(1), ...footerDetails],
    options: cluster.map(({ lineIndex, ...option }) => option),
    selectedIndex: cluster.findIndex((option) => option.selected),
  };
}
