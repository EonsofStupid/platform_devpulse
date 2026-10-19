import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Scrollbar visibility mode */
export type ScrollAreaScrollbarVisibility = "auto" | "always" | "scroll" | "hover";

/**
 * Structural props for the ScrollArea primitive.
 *
 * A scroll area provides custom-styled scrollbars for overflowing content.
 * For standard browser scrollbars, just use CSS overflow. Use this primitive
 * when you need visual control over scrollbar appearance.
 *
 * @example
 * ```svelte
 * <div {...scrollAreaAnatomy.attrs.root}>
 *   <div {...scrollAreaAnatomy.attrs.viewport}>
 *     <!-- long content -->
 *   </div>
 *   <div {...scrollAreaAnatomy.attrs.scrollbar} data-orientation="vertical">
 *     <div {...scrollAreaAnatomy.attrs.thumb} />
 *   </div>
 * </div>
 * ```
 */
export interface ScrollAreaPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the scroll area */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** When to show scrollbars. Default: "hover" */
	scrollbarVisibility?: ScrollAreaScrollbarVisibility;
	/** Scroll direction. Default: "vertical" */
	orientation?: "vertical" | "horizontal" | "both";
}
