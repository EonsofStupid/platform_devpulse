/**
 * @file Select Primitive Types
 * @description Structural type declarations for the select primitive.
 * Aligned to taxonomy contract: kind="select"
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA via component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Select root — context provider, no DOM */
export interface SelectProps extends BaseProps {
	/** Controlled open state */
	open?: boolean;
	/** Content */
	children?: Snippet;
}

/** SelectTrigger — button that opens the dropdown */
export interface SelectTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** SelectValue — displays the selected value */
export interface SelectValueProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}

/** SelectContent — dropdown panel */
export interface SelectContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** SelectViewport — scrollable viewport within content */
export interface SelectViewportProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** SelectItem — individual selectable option */
export interface SelectItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** SelectItemText — text label within an item */
export interface SelectItemTextProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}

/** SelectGroup — logical grouping of items */
export interface SelectGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** SelectLabel — label for a group */
export interface SelectLabelProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** SelectSeparator — visual divider between items/groups */
export interface SelectSeparatorProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
