/**
 * @file Callout Component Types
 * @kind callout
 * @layer components
 *
 * ARIA + state only. ZERO visual.
 * Visual props (variant presets, ColdLightProps) belong in ui/callout/.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type CalloutVariant = "info" | "success" | "warning" | "error" | "tip";

/** Callout component props — ARIA + state only. ZERO visual. */
export interface CalloutComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Semantic variant — drives ARIA state via data-state */
	variant?: CalloutVariant;
}
