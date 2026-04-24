import { describe, expect, it } from "vitest";
import { findSurfaceTitle, getLatestNonEmptyLine } from "../pane-preview";

describe("pane-preview", () => {
  it("returns the last non-empty line", () => {
    expect(getLatestNonEmptyLine("first\n\n second line \n")).toBe("second line");
  });

  it("skips terminal chrome lines used by claude and codex", () => {
    expect(
      getLatestNonEmptyLine(
        [
          "actual result line",
          "─────────────────────────────────────────",
          "❯ ",
          "─────────────────────────────────────────",
          "  ⏵⏵ auto mode on (shift+tab to cycle)",
          "",
          " gpt-5.4 medium fast · ~/workspace/misc/cmux-remote",
          "",
          "›",
        ].join("\n")
      )
    ).toBe("actual result line");
  });

  it("returns empty string when no non-empty lines exist", () => {
    expect(getLatestNonEmptyLine("\n  \n")).toBe("");
  });

  it("returns empty string when only terminal chrome lines exist", () => {
    expect(
      getLatestNonEmptyLine(
        [
          "─────────────────────────────────────────",
          "❯ ",
          "─────────────────────────────────────────",
          "  ⏵⏵ auto mode on (shift+tab to cycle)",
          " gpt-5.4 medium fast · ~/workspace/misc/cmux-remote",
          "›",
        ].join("\n")
      )
    ).toBe("");
  });

  it("skips prompt-prefixed and boxed claude welcome blocks", () => {
    expect(
      getLatestNonEmptyLine(
        [
          "real output line",
          "╭─ Claude Code ─────────────────────────╮",
          "│                                       │",
          "│          Welcome back Shota!          │",
          "│                                       │",
          "│                ▐▛███▜▌                │",
          "│               ▝▜█████▛▘               │",
          "│                 ▘▘ ▝▝                 │",
          "│                                       │",
          "│    Opus 4.7 (1M context) with me…     │",
          "│              Claude Max               │",
          "│  ~/workspace/misc/cmux-remote/server  │",
          "│                                       │",
          "╰───────────────────────────────────────",
          "> continuing prompt text",
          "› command prompt text",
          "❯ ready",
        ].join("\n")
      )
    ).toBe("real output line");
  });

  it("finds a surface title from the tree", () => {
    const tree = {
      type: "workspace",
      id: "workspace:1",
      name: "Workspace",
      children: [
        {
          type: "pane",
          id: "pane:1",
          name: "Pane 1",
          children: [
            { type: "surface", id: "surface:2", name: "Claude Review" },
          ],
        },
      ],
    };

    expect(findSurfaceTitle(tree, "surface:2")).toBe("Claude Review");
  });
});
