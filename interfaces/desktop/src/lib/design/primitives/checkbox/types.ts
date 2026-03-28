import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { UseCheckboxProps } from "$lib/design/behaviors/checkbox/checkbox.types.js";

/** Props for the Checkbox root — button with role="checkbox". */
export interface CheckboxRootProps
	extends Omit<HTMLButtonAttributes, "children" | "disabled" | "aria-label" | "aria-labelledby" | "aria-describedby">,
		UseCheckboxProps {
	/** Visual indicator snippet (check mark, indeterminate dash, etc.) */
	indicator?: Snippet;
	/** Label text snippet */
	label?: Snippet;
	children?: Snippet;
	class?: string;
}

/** Props for the Checkbox indicator sub-element. */
export interface CheckboxIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
	children?: Snippet;
	class?: string;
}

/** Props for the Checkbox label sub-element. */
export interface CheckboxLabelProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	children?: Snippet;
	class?: string;
}
