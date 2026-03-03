/**
 * @file InlineMessage Component Types
 * @kind inline-message
 * @layer components
 *
 * ARIA + state only. ZERO visual.
 * Visual props (ColdLightProps) belong in ui/inline-message/.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type InlineMessageTone = "info" | "success" | "warning" | "error" | "help";

/** InlineMessage component props — ARIA + behavioral. ZERO visual. */
export interface InlineMessageComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Semantic tone — drives color + icon via recipe */
	tone?: InlineMessageTone;
}
