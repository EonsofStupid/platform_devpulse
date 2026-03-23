/**
 * @file Spinner Types
 * @kind spinner
 * @layer components
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";
import type { SpinnerSize } from "./recipe.js";

export type { SpinnerSize };

export interface SpinnerProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style">,
		BaseProps,
		ComponentProps {
	active?: boolean;
	onActiveChange?: (active: boolean) => void;
	size?: SpinnerSize;
}
