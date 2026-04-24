import type { TreeNode } from "./cmux-rpc";

const DIVIDER_LINE_PATTERN = /^[\u2500-\u257F\u23AF\u2015\u2014-]{8,}\s*$/;
const AUTO_MODE_PATTERN = /^[⏵▶▷▸▹»]+\s+auto mode\b/i;
const MODEL_INFO_PATTERN =
  /\b(?:gpt-\d+(?:\.\d+)?|claude(?:-[a-z0-9.-]+)?|codex|sonnet|opus)\b/i;
const PROMPT_PREFIX_PATTERN = /^(?:❯|›|>)/;
const BOX_PREFIX_PATTERN = /^(?:[╭╮╰╯│─├┤┬┴┼┌┐└┘])/;
const PIPE_PREFIX_PATTERN = /^(?:\||│)/;

function isIgnorablePreviewLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (DIVIDER_LINE_PATTERN.test(trimmed)) return true;
  if (PROMPT_PREFIX_PATTERN.test(trimmed)) return true;
  if (BOX_PREFIX_PATTERN.test(trimmed)) return true;
  if (PIPE_PREFIX_PATTERN.test(trimmed)) return true;
  if (AUTO_MODE_PATTERN.test(trimmed)) return true;
  if (MODEL_INFO_PATTERN.test(trimmed)) return true;
  return false;
}

export function getLatestNonEmptyLine(text: string): string {
  const lines = text.split("\n");
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]?.trim();
    if (line && !isIgnorablePreviewLine(line)) return line;
  }
  return "";
}

export function findSurfaceTitle(tree: unknown, surfaceRef: string): string | null {
  if (!tree || typeof tree !== "object") return null;

  const stack: TreeNode[] = [tree as TreeNode];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    const nodeId = typeof node.id === "string" ? node.id : "";
    const nodeName = typeof node.name === "string" ? node.name : "";

    if (nodeId === surfaceRef || nodeName === surfaceRef) {
      return nodeName || nodeId || null;
    }

    if (Array.isArray(node.children)) {
      stack.push(...node.children);
    }
  }

  return null;
}
