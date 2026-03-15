'use client';

// REACT
import { useEffect, useRef, useState } from 'react';

// LEXICAL
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

interface UseEditorStateOptions {
  /**
   * Debounce delay in milliseconds. Do not set below 200ms.
   * High-frequency editor.update() calls on every keystroke will
   * degrade performance on large documents.
   */
  debounceMs?: number;
  onChange?: (serializedState: string) => void;
}

export function useEditorState({
  debounceMs = 300,
  onChange,
}: UseEditorStateOptions = {}) {
  const [editor] = useLexicalComposerContext();
  const [serializedState, setSerializedState] = useState<string>('');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const unregister = editor.registerUpdateListener(() => {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(() => {
        // Use editor.read() to ensure a full active editor context —
        // required in Lexical 0.40+ for node exportJSON() methods.
        const json = editor.read(() =>
          JSON.stringify(editor.getEditorState().toJSON()),
        );
        if (!onChangeRef.current) {
          setSerializedState(json);
        }
        onChangeRef.current?.(json);
      }, debounceMs);
    });

    return () => {
      unregister();
      if (timeout) clearTimeout(timeout);
    };
  }, [editor, debounceMs]);

  return { serializedState };
}
