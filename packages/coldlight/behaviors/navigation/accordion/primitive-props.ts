import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { AccordionType } from "./accordion.types.js";

/** Accordion orientation for keyboard navigation */
export type AccordionOrientation = "vertical" | "horizontal";

/**
 * Structural props for the Accordion primitive.
 *
 * An accordion is a set of vertically stacked disclosure panels. Each item
 * has a trigger (heading button) that toggles its content. In "single" mode,
 * only one item can be expanded at a time. In "multiple" mode, any number
 * of items can be open simultaneously.
 *
 * @example
 * ```svelte
 * <div {...accordionAnatomy.attrs.root}>
 *   <div {...accordionAnatomy.attrs.item}>
 *     <button {...accordionAnatomy.attrs.trigger} aria-expanded={open} aria-controls={panelId}>
 *       Section 1
 *     </button>
 *     <div {...accordionAnatomy.attrs.content} role="region" aria-labelledby={triggerId}>
 *       Panel content here
 *     </div>
 *   </div>
 * </div>
 * ```
 */
export interface AccordionPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the accordion */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Expansion mode — "single" allows one open item, "multiple" allows many. Default: "single" */
	type?: AccordionType;
	/** Currently expanded item value(s) — controlled mode */
	value?: string | string[];
	/** Initially expanded item value(s) — uncontrolled mode */
	defaultValue?: string | string[];
	/** Callback when expanded items change */
	onValueChange?: (value: string | string[]) => void;
	/** Disabled state — prevents all items from toggling */
	disabled?: boolean;
	/** Keyboard navigation direction. Default: "vertical" */
	orientation?: AccordionOrientation;
	/** Whether expanding an item collapses others (only in "single" mode). Default: true */
	collapsible?: boolean;
}
