import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Toggle group selection mode */
export type ToggleGroupType = "single" | "multiple";

/** Toggle group orientation */
export type ToggleGroupOrientation = "horizontal" | "vertical";

/**
 * Structural props for the ToggleGroup primitive.
 *
 * A toggle group presents a set of toggle buttons where one or more
 * can be pressed. In "single" mode, behaves like a segmented control.
 * In "multiple" mode, any combination is allowed. For mutually exclusive
 * options with labels, use RadioGroup instead.
 *
 * @example
 * ```svelte
 * <div {...toggleGroupAnatomy.attrs.root} role="toolbar" aria-label="Text alignment">
 *   <button {...toggleGroupAnatomy.attrs.item} aria-pressed={value === "left"}>Left</button>
 *   <button {...toggleGroupAnatomy.attrs.item} aria-pressed={value === "center"}>Center</button>
 *   <button {...toggleGroupAnatomy.attrs.item} aria-pressed={value === "right"}>Right</button>
 * </div>
 * ```
 */
export interface ToggleGroupPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the toggle group */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Selection mode — "single" allows one, "multiple" allows many. Default: "single" */
	type?: ToggleGroupType;
	/** Currently pressed value(s) */
	value?: string | string[];
	/** Callback when pressed value(s) change */
	onValueChange?: (value: string | string[]) => void;
	/** Keyboard navigation direction. Default: "horizontal" */
	orientation?: ToggleGroupOrientation;
	/** Disabled state — prevents all toggle interaction */
	disabled?: boolean;
}
