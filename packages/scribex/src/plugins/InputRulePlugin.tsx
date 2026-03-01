"use client";

// REACT
import { useEffect } from "react";

// LEXICAL
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TextNode, $createParagraphNode } from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createListNode, $createListItemNode } from "@lexical/list";
import { $createCodeBlockNode } from "../nodes/CodeBlockNode";
import { $createHorizontalRuleNode } from "../nodes/HorizontalRuleNode";

// COMMANDS
import { OPEN_SLASH_MENU_COMMAND } from "../commands";

// TYPES
import type { InputRule } from "../types";

/**
 * Built-in rules. Note: onMatch runs inside a node transform, which is already
 * within an editor.update() context. Do NOT wrap mutations in editor.update()
 * here — that would be a nested update (see CLAUDE.md Section 7.1).
 */
const BUILTIN_RULES: InputRule[] = [
  {
    pattern: /^# $/,
    type: "heading",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const heading = $createHeadingNode("h1");
      parent.replace(heading);
      heading.selectEnd();
    },
  },
  {
    pattern: /^## $/,
    type: "heading",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const heading = $createHeadingNode("h2");
      parent.replace(heading);
      heading.selectEnd();
    },
  },
  {
    pattern: /^### $/,
    type: "heading",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const heading = $createHeadingNode("h3");
      parent.replace(heading);
      heading.selectEnd();
    },
  },
  {
    pattern: /^> $/,
    type: "quote",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const quote = $createQuoteNode();
      parent.replace(quote);
      quote.selectEnd();
    },
  },
  {
    pattern: /^[-*] $/,
    type: "custom",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const list = $createListNode("bullet");
      const item = $createListItemNode();
      list.append(item);
      parent.replace(list);
      item.selectEnd();
    },
  },
  {
    pattern: /^1\. $/,
    type: "custom",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const list = $createListNode("number");
      const item = $createListItemNode();
      list.append(item);
      parent.replace(list);
      item.selectEnd();
    },
  },
  {
    pattern: /^\[\] $/,
    type: "custom",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const list = $createListNode("check");
      const item = $createListItemNode();
      list.append(item);
      parent.replace(list);
      item.selectEnd();
    },
  },
  {
    pattern: /^\[x\] $/,
    type: "custom",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const list = $createListNode("check");
      const item = $createListItemNode(true);
      list.append(item);
      parent.replace(list);
      item.selectEnd();
    },
  },
  {
    pattern: /^---$/,
    type: "divider",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const rule = $createHorizontalRuleNode();
      const trailingParagraph = $createParagraphNode();
      parent.replace(rule);
      rule.insertAfter(trailingParagraph);
      trailingParagraph.selectEnd();
    },
  },
  {
    pattern: /^```$/,
    type: "code",
    onMatch: (_match, node) => {
      const parent = node.getParent();
      if (!parent) return;
      const codeBlock = $createCodeBlockNode({ code: "", language: "javascript", autoFocus: true });
      // DecoratorNodes can't hold a cursor, so insert a trailing paragraph
      // to prevent the "selection lost" error. The autoFocus flag on the
      // CodeBlockNode will focus the textarea once it mounts.
      const trailingParagraph = $createParagraphNode();
      parent.replace(codeBlock);
      codeBlock.insertAfter(trailingParagraph);
      trailingParagraph.selectEnd();
    },
  },
];

interface InputRulePluginProps {
  rules?: InputRule[];
}

export function InputRulePlugin({ rules = [] }: InputRulePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const allRules = [...BUILTIN_RULES, ...rules];

    // Pre-compute the set of first characters that can start a rule match.
    // This lets us skip regex matching entirely for the vast majority of keystrokes.
    const triggerFirstChars = new Set<string>();
    for (const rule of allRules) {
      // Extract the literal first char from each pattern's source.
      // Patterns like /^# $/, /^## $/, /^> $/, /^[-*] $/, /^1\. $/ etc.
      const src = rule.pattern.source;
      // Skip the leading ^ if present
      const start = src.startsWith("^") ? 1 : 0;
      const ch = src[start];
      if (ch && ch !== "[" && ch !== "(" && ch !== "\\") {
        triggerFirstChars.add(ch);
      } else if (ch === "[") {
        // Character class like [-*] — extract individual chars
        for (let i = start + 1; i < src.length; i++) {
          if (src[i] === "]") break;
          if (src[i] !== "-" || i === start + 1) triggerFirstChars.add(src[i]!);
        }
      } else if (ch === "\\") {
        // Escaped char like \[
        const next = src[start + 1];
        if (next) triggerFirstChars.add(next);
      }
    }

    return editor.registerNodeTransform(TextNode, (textNode) => {
      // IME safety: skip transforms during composition
      const editorWithComposition = editor as unknown as {
        _compositionKey: string | null;
      };
      if (editorWithComposition._compositionKey !== null) return;

      const text = textNode.getTextContent();

      // Fast exit: skip everything for text longer than 6 chars.
      // All built-in rules match patterns ≤ 6 chars (e.g. "### ", "[x] ", "```").
      if (text.length > 6) return;

      // Slash menu trigger: "/" at start of an otherwise empty paragraph
      if (text === "/") {
        const parent = textNode.getParent();
        if (parent && parent.getChildrenSize() === 1) {
          // Dispatch needs to happen outside the transform — defer with queueMicrotask
          queueMicrotask(() => {
            editor.dispatchCommand(OPEN_SLASH_MENU_COMMAND, undefined);
          });
          return;
        }
      }

      // Fast exit: if first char doesn't match any rule's trigger, skip regex
      const firstChar = text[0];
      if (!firstChar || !triggerFirstChars.has(firstChar)) return;

      // Check against all registered rules
      for (const rule of allRules) {
        const match = text.match(rule.pattern);
        if (match) {
          // Remove trigger text, then call onMatch (already in update context)
          textNode.setTextContent("");
          rule.onMatch(match, textNode, editor);
          return;
        }
      }
    });
  }, [editor, rules]);

  return null;
}
