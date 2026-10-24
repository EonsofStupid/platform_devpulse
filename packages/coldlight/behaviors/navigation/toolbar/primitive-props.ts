import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Toolbar orientation */
export type ToolbarOrientation = "horizontal" | "vertical";

/**
 * Structural props for the Toolbar primitive.
 *
 * A toolbar groups related action controls (buttons, toggles, menus)
 * into a single keyboard navigation unit. Arrow keys move between items.
 * Tab moves in/out of the toolbar as a whole.
 *
 * @example
 * ```svelte
 * <div {...toolbarAnatomy.attrs.root} role="toolbar" aria-label="Formatting">
 *   <button {...toolbarAnatomy.attrs.item}>Bold</button>
 *   <button {...toolbarAnatomy.attrs.item}>Italic</button>
 *   <button {...toolbarAnatomy.attrs.item}>Underline</button>
 * </div>
 * ```
 */
export interface ToolbarPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the toolbar */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Toolbar orientation for keyboard navigation. Default: "horizontal" */
	orientation?: ToolbarOrientation;
}
