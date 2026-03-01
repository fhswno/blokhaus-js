/**
 * Font family entries for the FontPicker dropdown.
 *
 * Values use CSS variable references so apps can swap the actual
 * Google Font (or any other font) without touching the library.
 */

export interface FontFamilyEntry {
  /** Human-readable label shown in the picker */
  label: string;
  /** CSS font-family value to apply. Empty string = remove / default. */
  value: string;
  /** Font stack used to render the preview text in the picker dropdown */
  preview: string;
}

export const DEFAULT_FONT_FAMILIES: FontFamilyEntry[] = [
  { label: "Default", value: "", preview: "var(--scribex-font-sans)" },
  { label: "Serif", value: "var(--scribex-font-serif)", preview: "var(--scribex-font-serif)" },
  { label: "Mono", value: "var(--scribex-font-mono)", preview: "var(--scribex-font-mono)" },
  { label: "Hand", value: "var(--scribex-font-hand)", preview: "var(--scribex-font-hand)" },
];
