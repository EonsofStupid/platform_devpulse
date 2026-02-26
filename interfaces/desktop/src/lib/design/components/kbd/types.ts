/**
 * @file Kbd Component Types
 * @kind kbd
 * @layer components
 *
 * Keyboard shortcut indicator using semantic <kbd> HTML.
 * No ARIA needed — <kbd> provides native semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type KbdSize = "sm" | "md" | "lg";

/** Kbd component props — keyboard shortcut display */
export interface KbdComponentProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Size variant */
	size?: KbdSize;
}
