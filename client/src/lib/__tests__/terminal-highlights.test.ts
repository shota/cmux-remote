import { describe, expect, it } from "vitest";
import { applyTerminalHighlights } from "../terminal-highlights";

describe("applyTerminalHighlights", () => {
  it("adds ansi background to AI command lines and model info", () => {
    const highlighted = applyTerminalHighlights(
      [
        "some output",
        "› Run /review on my current changes",
        "",
        "  gpt-5.4 medium fast · ~/.zsh/bin",
      ].join("\n")
    );

    expect(highlighted).toContain("\u001b[48;5;238m\u001b[38;5;255m› Run /review on my current changes\u001b[0m");
    expect(highlighted).toContain("\u001b[48;5;238m\u001b[38;5;255m  gpt-5.4 medium fast · ~/.zsh/bin\u001b[0m");
  });

  it("adds ansi background only to the framed prompt line", () => {
    const highlighted = applyTerminalHighlights(
      ["─────────────────────────────────────────", "❯ ", "─────────────────────────────────────────"].join("\n")
    );

    expect(highlighted).toContain("\u001b[48;5;238m\u001b[38;5;255m❯\u001b[0m");
    expect(highlighted).not.toContain("\u001b[48;5;238m\u001b[38;5;255m─────────────────────────────────────────\u001b[0m");
  });

  it("does not highlight unrelated lines", () => {
    const highlighted = applyTerminalHighlights(
      [
        "plain output",
        "next line",
      ].join("\n")
    );

    expect(highlighted).toBe("plain output\nnext line");
  });
});
