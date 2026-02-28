/**
 * @file Calendar Component Types
 * @kind calendar
 * @layer components
 *
 * Prop types for all Calendar sub-components.
 * ColdLight-owned — renders ARIA structure directly.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

// =============================================================================
// SIZE
// =============================================================================

export type Size = "sm" | "md" | "lg";

// =============================================================================
// ROOT PROPS
// =============================================================================

/** Calendar root props — creates context and manages state */
export interface CalendarProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Currently selected date */
	value?: Date | undefined;
	/** Called when the selected date changes */
	onValueChange?: (value: Date | undefined) => void;
	/** Currently displayed month */
	month?: Date;
	/** Called when the displayed month changes */
	onMonthChange?: (month: Date) => void;
	/** Minimum selectable date */
	min?: Date;
	/** Maximum selectable date */
	max?: Date;
	/** Whether the calendar is disabled */
	disabled?: boolean;
	/** Locale for formatting (BCP 47 tag) */
	locale?: string;
	/** Size variant */
	size?: Size;
}

// =============================================================================
// HEADER PROPS
// =============================================================================

/** CalendarHeader props — month/year display + navigation buttons */
export interface CalendarHeaderProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// GRID PROPS
// =============================================================================

/** CalendarGrid props — day grid with role="grid" */
export interface CalendarGridProps
	extends Omit<HTMLAttributes<HTMLTableElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CELL PROPS
// =============================================================================

/** CalendarCell props — individual day cell */
export interface CalendarCellProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** The date this cell represents */
	date: Date;
}
