/**
 * @file Callout Component Types
 * @kind callout
 * @layer components
 *
 * Extends primitive with visual variant and accessible label.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type CalloutVariant = "info" | "success" | "warning" | "error" | "tip";

/** Callout component props — ARIA + recipe + primitive */
export interface CalloutComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Semantic variant — drives color + accent via recipe */
	variant?: CalloutVariant;
}
