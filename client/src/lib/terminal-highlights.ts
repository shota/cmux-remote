const MODEL_INFO_PATTERN =
  /\b(?:gpt-\d+(?:\.\d+)?|claude(?:-[a-z0-9.-]+)?|codex|sonnet|opus)\b/i;
const COMMAND_LINE_PATTERN = /^[›>]\s+\S.+$/;
const PROMPT_LINE_PATTERN = /^[❯>]\s*$/;
const DIVIDER_LINE_PATTERN = /^[\u2500-\u257F\u23AF\u2015\u2014-]{8,}\s*$/;
const ANSI_PATTERN = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;
const HIGHLIGHT_START = "\u001b[48;5;238m\u001b[38;5;255m";
const HIGHLIGHT_END = "\u001b[0m";

function stripAnsi(line: string): string {
  return line.replace(ANSI_PATTERN, "");
}

function isModelMetadata(line: string): boolean {
  return MODEL_INFO_PATTERN.test(stripAnsi(line).trimEnd());
}

function shouldHighlightPrompt(lines: string[], index: number): boolean {
  const prev = stripAnsi(lines[index - 1] ?? "").trimEnd();
  const current = stripAnsi(lines[index] ?? "").trimEnd();
  const next = stripAnsi(lines[index + 1] ?? "").trimEnd();

  return (
    PROMPT_LINE_PATTERN.test(current) &&
    DIVIDER_LINE_PATTERN.test(prev) &&
    DIVIDER_LINE_PATTERN.test(next)
  );
}

function shouldHighlightLine(lines: string[], index: number): boolean {
  const current = stripAnsi(lines[index] ?? "").trimEnd();
  if (!current) return false;

  if (shouldHighlightPrompt(lines, index)) return true;
  if (COMMAND_LINE_PATTERN.test(current)) return true;

  const prev = stripAnsi(lines[index - 1] ?? "").trimEnd();
  const beforePrev = stripAnsi(lines[index - 2] ?? "").trimEnd();
  if (!isModelMetadata(lines[index] ?? "")) return false;

  return COMMAND_LINE_PATTERN.test(prev) || (!prev && COMMAND_LINE_PATTERN.test(beforePrev));
}

export function applyTerminalHighlights(content: string): string {
  if (!content) return content;

  const lines = content.split("\n");
  return lines
    .map((line, index) => {
      if (!shouldHighlightLine(lines, index)) return line.trimEnd();
      return `${HIGHLIGHT_START}${line.trimEnd()}${HIGHLIGHT_END}`;
    })
    .join("\n");
}
