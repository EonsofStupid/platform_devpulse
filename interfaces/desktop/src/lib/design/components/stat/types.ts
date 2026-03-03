/**
 * @file Stat Component Types
 * @kind stat
 * @layer components
 *
 * ARIA + behavioral props only. ZERO visual.
 * Visual props (size, ColdLightProps) belong in ui/stat/.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type StatSize = "sm" | "md" | "lg";

/** Stat component props — ARIA + behavioral. ZERO visual. */
export interface StatComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
