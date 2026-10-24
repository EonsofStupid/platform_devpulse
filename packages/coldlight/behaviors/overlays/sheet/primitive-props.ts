import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { SheetSide } from "./sheet.types.js";

/**
 * Structural props for the Sheet primitive.
 *
 * A sheet is a modal panel that slides in from a screen edge.
 * Structurally identical to dialog but with directional entry animation
 * controlled by the `side` prop.
 *
 * Common uses: navigation drawers, filter panels, settings panels,
 * mobile-first layouts where content slides over.
 *
 * @example
 * ```svelte
 * <button {...sheetAnatomy.attrs.trigger}>Open filters</button>
 * <div {...sheetAnatomy.attrs.overlay} />
 * <div {...sheetAnatomy.attrs.content} role="dialog" aria-modal="true" data-side="right">
 *   <h2 {...sheetAnatomy.attrs.title}>Filters</h2>
 *   <!-- filter controls -->
 *   <button {...sheetAnatomy.attrs.close} aria-label="Close">×</button>
 * </div>
 * ```
 */
export interface SheetPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the sheet */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Which edge the sheet slides from. Default: "right" */
	side?: SheetSide;
	/** Whether the sheet is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Close when Escape key is pressed. Default: true */
	closeOnEscape?: boolean;
	/** Close when clicking outside (on overlay). Default: true */
	closeOnOutsideClick?: boolean;
}
