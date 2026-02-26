/**
 * @file InlineMessage Component Types
 * @kind inline-message
 * @layer components
 *
 * Extends primitive with semantic tone and aria-live control.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type InlineMessageTone = "info" | "success" | "warning" | "error" | "help";

/** InlineMessage component props — ARIA + recipe + primitive */
export interface InlineMessageComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Semantic tone — drives color + icon via recipe */
	tone?: InlineMessageTone;
}
