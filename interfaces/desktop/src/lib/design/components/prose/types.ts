/**
 * @file Prose Component Types
 * @kind prose
 * @layer components
 *
 * Rich text content container with prose styling.
 * Markdown-friendly — applies typographic styling to child HTML.
 *
 * Extends ProsePrimitiveProps from primitives.
 */

import type { ProsePrimitiveProps } from "$lib/design/primitives/prose/index.js";

export type ProsePreset = "default" | "stark" | "glass" | "flat" | "matte";

/** Prose component props — extends primitive + ColdLight preset */
export interface ProseProps extends ProsePrimitiveProps {
	/** Style preset. Default: "default". */
	preset?: ProsePreset;
}
