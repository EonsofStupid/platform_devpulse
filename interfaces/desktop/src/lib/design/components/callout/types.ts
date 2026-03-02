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
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type CalloutVariant = "info" | "success" | "warning" | "error" | "tip";

export const CALLOUT_VARIANT_PRESETS: Record<CalloutVariant, string> = {
	info: "callout-info",
	success: "callout-info",
	warning: "callout-warning",
	error: "callout-warning",
	tip: "callout-tip",
};

/** Callout component props — ColdLight 8-axis + ARIA + recipe */
export interface CalloutComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Semantic variant — drives color + accent via recipe */
	variant?: CalloutVariant;
}
