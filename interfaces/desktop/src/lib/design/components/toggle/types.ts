/**
 * @file Toggle Types
 * @kind toggle
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ToggleSize = "sm" | "md" | "lg";

export interface ToggleProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "disabled">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	disabled?: boolean;
	size?: ToggleSize;
}
