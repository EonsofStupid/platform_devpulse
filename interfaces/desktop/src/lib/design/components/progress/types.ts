/**
 * @file Progress Types
 * @kind progress
 * @layer components
 *
 * DUMB component. Progressbar structure + ARIA only.
 * Visual treatment via class prop from caller.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	/** CSS classes — structural + visual from caller */
	class?: string;
	/** Children snippet */
	children?: Snippet;
	/** Current value (null = indeterminate) */
	value?: number | null;
	/** Maximum value */
	max?: number;
	/** Size — drives recipe structural class */
	size?: ProgressSize;
}
