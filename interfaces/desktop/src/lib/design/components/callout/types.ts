/**
 * @file Callout Types
 * @kind callout
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type CalloutVariant = "info" | "success" | "warning" | "error" | "tip";

export const CALLOUT_VARIANT_PRESETS: Record<CalloutVariant, string> = {
	info: "callout-info",
	success: "callout-info",
	warning: "callout-warning",
	error: "callout-warning",
	tip: "callout-tip",
};

export interface CalloutProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	variant?: CalloutVariant;
}
