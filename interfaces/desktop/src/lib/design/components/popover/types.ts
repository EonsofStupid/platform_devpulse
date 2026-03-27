/**
 * @file Popover Component Types
 * @kind popover
 * @layer components
 */

import type { Snippet } from "svelte";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type PopoverPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface PopoverProps extends ComponentProps {
	preset?: PopoverPreset;
	children?: Snippet;
	trigger?: Snippet;
	content?: Snippet;
	open?: boolean;
	onOpenChange?: (value: boolean) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
}
