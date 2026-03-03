/**
 * @file Kbd Component Types
 * @kind kbd
 * @layer components
 *
 * ARIA + state only. ZERO visual.
 * Visual props (ColdLightProps) belong in ui/kbd/.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type KbdSize = "sm" | "md" | "lg";

/** Kbd component props — ARIA + behavioral. ZERO visual. */
export interface KbdComponentProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Size variant */
	size?: KbdSize;
}
