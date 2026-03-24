/**
 * @file Popover Component Types
 * @kind popover
 * @layer components
 */

import type { Snippet } from "svelte";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export interface PopoverProps extends ComponentProps {
	children?: Snippet;
	trigger?: Snippet;
	content?: Snippet;
	open?: boolean;
	onOpenChange?: (value: boolean) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
}
