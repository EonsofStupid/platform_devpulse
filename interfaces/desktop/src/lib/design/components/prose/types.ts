/**
 * @file Prose Component Types
 * @kind prose
 * @layer components
 *
 * Rich text content container with prose styling.
 * Markdown-friendly — applies typographic styling to child HTML.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type ProseSize = "sm" | "base" | "lg";

/** Prose component props — rich text container */
export interface ProseComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Prose size variant */
	size?: ProseSize;
}
