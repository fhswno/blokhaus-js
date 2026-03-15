"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";

export interface ImagePayload {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<ReactElement> {
  __src: string;
  __altText: string;
  __width: number | undefined;
  __height: number | undefined;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "center";
    div.style.width = "100%";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement("img");
    img.setAttribute("src", this.__src);
    img.setAttribute("alt", this.__altText);
    if (this.__width) img.setAttribute("width", String(this.__width));
    if (this.__height) img.setAttribute("height", String(this.__height));
    return { element: img };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serializedNode.src,
      altText: serializedNode.altText,
      width: serializedNode.width,
      height: serializedNode.height,
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      type: "image",
      version: 1,
    };
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  setWidth(width: number): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  decorate(): ReactElement {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.getKey()}
      />
    );
  }
}

function convertImageElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    const src = domNode.getAttribute("src");
    const alt = domNode.getAttribute("alt") || "";
    if (src) {
      const node = $createImageNode({ src, altText: alt });
      return { node };
    }
  }
  return null;
}

function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const imgRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const isTouchDevice = useRef(false);
  const isDraggingRef = useRef(false);
  const dragWidthRef = useRef<number | null>(null);

  // Detect touch device once on mount
  useEffect(() => {
    isTouchDevice.current =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;
  }, []);

  // Click to select
  useEffect(() => {
    return editor.registerCommand(
      CLICK_COMMAND,
      (event: MouseEvent) => {
        if (isDraggingRef.current) return false;
        if (imgRef.current?.contains(event.target as Node)) {
          if (!event.shiftKey) {
            clearSelection();
          }
          setSelected(true);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, clearSelection, setSelected]);

  // Delete on backspace/delete
  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected) {
        event.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (node) {
            node.remove();
          }
        });
        return true;
      }
      return false;
    },
    [editor, isSelected, nodeKey],
  );

  useEffect(() => {
    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      onDelete,
      COMMAND_PRIORITY_LOW,
    );
    const unregisterDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      onDelete,
      COMMAND_PRIORITY_LOW,
    );
    return () => {
      unregisterBackspace();
      unregisterDelete();
    };
  }, [editor, onDelete]);

  // Notion-style side handle resize — drag left or right edge
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, side: "left" | "right") => {
      e.preventDefault();
      e.stopPropagation();

      const imgEl = imgRef.current?.querySelector("img");
      if (!imgEl) return;

      const startX = e.clientX;
      const startWidth = imgEl.getBoundingClientRect().width;
      const containerWidth =
        imgRef.current?.parentElement?.clientWidth ?? Infinity;

      isDraggingRef.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (moveEvent: MouseEvent) => {
        // Dragging left handle outward (left) or right handle outward (right) grows the image.
        // Both sides contribute symmetrically to keep the image centered.
        const rawDelta = moveEvent.clientX - startX;
        const delta = side === "left" ? -rawDelta * 2 : rawDelta * 2;
        const newWidth = Math.min(
          containerWidth,
          Math.max(100, Math.round(startWidth + delta)),
        );
        dragWidthRef.current = newWidth;
        setDragWidth(newWidth);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        const finalWidth = dragWidthRef.current;
        isDraggingRef.current = false;
        dragWidthRef.current = null;
        setDragWidth(null);

        if (finalWidth != null && finalWidth !== width) {
          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
              node.setWidth(finalWidth);
            }
          });
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [editor, nodeKey, width],
  );

  const showHandles = isSelected && !isTouchDevice.current;
  const displayWidth =
    dragWidth != null ? `${dragWidth}px` : width ? `${width}px` : undefined;

  // Notion-style: vertical bar handles on left and right edges
  const handleStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: "-2px",
    width: "6px",
    height: "48px",
    maxHeight: "50%",
    backgroundColor: "var(--blokhaus-accent, #3b82f6)",
    borderRadius: "3px",
    cursor: "col-resize",
    zIndex: 10,
    opacity: 0.9,
    transition: "opacity 100ms ease",
  });

  return (
    <div
      ref={imgRef}
      data-testid="image-node"
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        maxWidth: "100%",
        position: "relative",
        cursor: "pointer",
      }}
      role="img"
      aria-label={altText}
    >
      <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
        <img
          src={src}
          alt={altText}
          style={{
            width: displayWidth,
            maxWidth: "100%",
            height: "auto",
            display: "block",
            borderRadius: "var(--blokhaus-radius, 0.5rem)",
            outline: isSelected
              ? "2px solid var(--blokhaus-ring, #3b82f6)"
              : "none",
            outlineOffset: "2px",
          }}
          draggable={false}
        />
        {showHandles && (
          <>
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "left")}
              data-testid="image-resize-left"
              style={handleStyle("left")}
            />
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "right")}
              data-testid="image-resize-right"
              style={handleStyle("right")}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return new ImageNode(
    payload.src,
    payload.altText,
    payload.width,
    payload.height,
    payload.key,
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
