/**
 * @file Callout Types
 * @kind callout
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type CalloutVariant = "info" | "success" | "warning" | "error" | "tip";


export interface CalloutProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	variant?: CalloutVariant;
}
