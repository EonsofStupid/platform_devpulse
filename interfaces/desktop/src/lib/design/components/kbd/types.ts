/**
 * @file Kbd Types
 * @kind kbd
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type KbdSize = "sm" | "md" | "lg";
export type KbdPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface KbdProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class">,
		ComponentProps {
	children?: Snippet;
	/** Style preset preset */
	preset?: KbdPreset;
	size?: KbdSize;
}
