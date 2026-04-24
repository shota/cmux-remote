import { describe, expect, it } from "vitest";
import { parseTerminalChoices } from "../terminal-choices";

describe("parseTerminalChoices", () => {
  it("parses codex or claude approval prompts", () => {
    const prompt = parseTerminalChoices(
      [
        "Would you like to run the following command?",
        "",
        "Reason: Do you want to allow creating the git commit?",
        "",
        "› 1. Yes, proceed (y)",
        "  2. No, and tell Codex what to do differently (esc)",
        "",
        "Press enter to confirm or esc to cancel",
      ].join("\n")
    );

    expect(prompt).toEqual({
      title: "Reason: Do you want to allow creating the git commit?",
      details: [
        "Press enter to confirm or esc to cancel",
      ],
      options: [
        { index: 1, label: "Yes, proceed", description: "", token: "y", kind: "send", selected: true },
        { index: 2, label: "No, and tell Codex what to do differently", description: "", token: "esc", kind: "send", selected: false },
      ],
      selectedIndex: 0,
    });
  });

  it("parses numbered option lists with descriptions", () => {
    const prompt = parseTerminalChoices(
      [
        "☐ 選択肢",
        "",
        "1, 2, 3のうちどれを選びますか？",
        "",
        "❯ 1. 1",
        "     選択肢1を選びます",
        "  2. 2",
        "     選択肢2を選びます",
        "  3. 3",
        "     選択肢3を選びます",
        "  4. Type something.",
        "  5. Chat about this",
      ].join("\n")
    );

    expect(prompt?.title).toBe("1, 2, 3のうちどれを選びますか？");
    expect(prompt?.options[0]).toEqual({
      index: 1,
      label: "1",
      description: "選択肢1を選びます",
      token: "1",
      kind: "send",
      selected: true,
    });
    expect(prompt?.options[3]?.kind).toBe("input");
    expect(prompt?.options[4]?.kind).toBe("input");
    expect(prompt?.selectedIndex).toBe(0);
  });

  it("parses ask user question style prompts with footer navigation hints", () => {
    const prompt = parseTerminalChoices(
      [
        "─────────────────────────────────────────────────────────────────────",
        " ☐ 好きな色",
        "",
        "好きな色はどれですか？",
        "",
        "❯ 1. 赤",
        "     情熱的で目を引く色",
        "  2. 青",
        "     落ち着いた爽やかな色",
        "  3. 緑",
        "     自然で安らぐ色",
        "  4. Type something.",
        "─────────────────────────────────────────────────────────────────────",
        "  5. Chat about this",
        "",
        "Enter to select · ↑/↓ to navigate · Esc to cancel",
      ].join("\n")
    );

    expect(prompt?.options).toHaveLength(5);
    expect(prompt?.options[3]?.kind).toBe("input");
    expect(prompt?.details[prompt.details.length - 1]).toBe("Enter to select · ↑/↓ to navigate · Esc to cancel");
    expect(prompt?.selectedIndex).toBe(0);
  });

  it("returns null when there is not a real choice list", () => {
    expect(parseTerminalChoices("plain output\n› single line")).toBeNull();
  });

  it("returns null when the choice block is stale and newer output follows", () => {
    expect(
      parseTerminalChoices(
        [
          "  1. Yes",
          "  2. No",
          "",
          "new output after the choices",
        ].join("\n")
      )
    ).toBeNull();
  });
});
