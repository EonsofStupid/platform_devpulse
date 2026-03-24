/**
 * @file Sheet Component Types
 * @kind sheet
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type SheetSize = "sm" | "md" | "lg" | "xl" | "full";
export type SheetSide = "left" | "right" | "top" | "bottom";

export interface SheetComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class">,
		ComponentProps {
	children?: Snippet;
	trigger?: Snippet;
	size?: SheetSize;
	side?: SheetSide;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	label?: string;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
}
