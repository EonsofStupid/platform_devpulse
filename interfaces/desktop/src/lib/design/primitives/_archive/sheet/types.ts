/**
 * @file primitives/sheet/types.ts
 * @layer primitives
 *
 * Type definitions for Sheet primitive.
 * Sheet is a Dialog variant that slides in from a side.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

// ============================================
// SHEET SIDE
// ============================================

/**
 * Side from which the sheet slides in.
 */
export type SheetSide = "left" | "right" | "top" | "bottom";

// ============================================
// SHEET SLOTS
// ============================================

export const SheetSlots = [
	"root",
	"trigger",
	"portal",
	"overlay",
	"content",
	"title",
	"description",
	"close",
] as const;

export type SheetSlot = (typeof SheetSlots)[number];

// ============================================
// SHEET STATE
// ============================================

export type SheetState = "open" | "closed";

// ============================================
// ROOT PROPS
// ============================================

export interface SheetRootProps {
	/** Controlled open state (bindable) */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Children (Trigger, Portal) */
	children?: Snippet;
	/** User-defined stable ID */
	"data-id"?: string;
}

// ============================================
// TRIGGER PROPS
// ============================================

export interface SheetTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	/** Button content */
	children?: Snippet;
	/** User-defined stable ID */
	"data-id"?: string;
}

// ============================================
// PORTAL PROPS
// ============================================

export interface SheetPortalProps {
	/** Portal target selector or element (default: body) */
	to?: string | HTMLElement;
	/** Disable portal rendering */
	disabled?: boolean;
	/** Children (Overlay, Content) */
	children?: Snippet;
	/** User-defined stable ID */
	"data-id"?: string;
}

// ============================================
// OVERLAY PROPS
// ============================================

export interface SheetOverlayProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	/** Snippet receives { open } for animations */
	children?: Snippet<[{ open: boolean }]>;
	/** User-defined stable ID */
	"data-id"?: string;
}

// ============================================
// CONTENT PROPS
// ============================================

export interface SheetContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	/** Side the sheet slides in from (default: "right") */
	side?: SheetSide;
	/** Snippet receives { open } for animations */
	children?: Snippet<[{ open: boolean }]> | Snippet;
	/** Close on escape key (default: true) */
	closeOnEscape?: boolean;
	/** Close on click outside (default: true) */
	closeOnOutsideClick?: boolean;
	/** Trap focus inside sheet (default: true) */
	trapFocus?: boolean;
	/** Prevent body scroll (default: true) */
	preventScroll?: boolean;
	/** User-defined stable ID */
	"data-id"?: string;
}

// ============================================
// TITLE PROPS
// ============================================

export interface SheetTitleProps
	extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children"> {
	/** Heading level 1-6 (default: 2) */
	level?: 1 | 2 | 3 | 4 | 5 | 6;
	/** Title content */
	children?: Snippet;
	/** User-defined stable ID */
	"data-id"?: string;
}

// ============================================
// DESCRIPTION PROPS
// ============================================

export interface SheetDescriptionProps
	extends Omit<HTMLAttributes<HTMLParagraphElement>, "style" | "children"> {
	/** Description content */
	children?: Snippet;
	/** User-defined stable ID */
	"data-id"?: string;
}

// ============================================
// CLOSE PROPS
// ============================================

export interface SheetCloseProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	/** Button content */
	children?: Snippet;
	/** User-defined stable ID */
	"data-id"?: string;
}
