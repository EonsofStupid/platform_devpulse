/**
 * @file Kbd Types
 * @kind kbd
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type KbdSize = "sm" | "md" | "lg";

export interface KbdProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class">,
		ComponentProps {
	children?: Snippet;
	size?: KbdSize;
}
