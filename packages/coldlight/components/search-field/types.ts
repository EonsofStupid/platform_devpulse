/**
 * @file SearchField Types
 * @kind search-field
 * @layer components
 */

import type { SearchFieldPrimitiveProps } from "#coldlight/behaviors/inputs/search-field/index.js";

export type SearchFieldSize = "sm" | "md" | "lg";
export type SearchFieldPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SearchFieldProps extends SearchFieldPrimitiveProps {
	/** Current search query value */
	value?: string;
	/** Callback when search value changes */
	onValueChange?: (value: string) => void;
	/** Callback when clear button is pressed */
	onClear?: () => void;
	/** Disabled state */
	disabled?: boolean;
	/** Placeholder text */
	placeholder?: string;
	/** Size — structural class */
	size?: SearchFieldSize;
	/** Visual preset */
	preset?: SearchFieldPreset;
	/** Accessible label */
	"aria-label"?: string;
	/** Accessible description reference */
	"aria-describedby"?: string;
}
