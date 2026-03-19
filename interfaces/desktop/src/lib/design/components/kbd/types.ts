/**
 * @file Kbd Types
 * @kind kbd
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type KbdSize = "sm" | "md" | "lg";

export interface KbdProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	size?: KbdSize;
}
