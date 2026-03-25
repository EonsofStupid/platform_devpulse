/**
 * @file Popover Component Types
 * @kind popover
 * @layer components
 */

import type { Snippet } from "svelte";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type PopoverIntent = "default" | "stark" | "glass" | "flat" | "matte";

export interface PopoverProps extends ComponentProps {
	intent?: PopoverIntent;
	children?: Snippet;
	trigger?: Snippet;
	content?: Snippet;
	open?: boolean;
	onOpenChange?: (value: boolean) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
}
