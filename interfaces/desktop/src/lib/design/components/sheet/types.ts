/**
 * @file Sheet Component Types
 * @kind sheet
 * @layer components
 *
 * Extends primitive with ARIA state props, side, and sizing.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type SheetSize = "sm" | "md" | "lg" | "xl" | "full";
export type SheetSide = "left" | "right" | "top" | "bottom";

/** Sheet component props — ARIA + composition + primitive */
export interface SheetComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Trigger content snippet — rendered inside the trigger button */
	trigger?: Snippet;
	/** Size variant — controls width/height of the content panel */
	size?: SheetSize;
	/** Side the sheet slides in from. @default "right" */
	side?: SheetSide;
	/** Whether the sheet is open. @default false */
	open?: boolean;
	/** Called when open state changes. */
	onOpenChange?: (open: boolean) => void;
	/** Accessible label for the sheet dialog. */
	label?: string;
	/** Close on Escape key. @default true */
	closeOnEscape?: boolean;
	/** Close on outside click (overlay). @default true */
	closeOnOutsideClick?: boolean;
}
