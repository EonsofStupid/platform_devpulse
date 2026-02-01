/**
 * @file RadioGroup Primitive Types
 * @description Structural type declarations for the radio-group primitive.
 * Aligned to taxonomy contract: kind="radio-group"
 * Slots: root, item, indicator
 * ariaStateProvider: "coldlight" — native buttons with role="radiogroup"/"radio" + aria-checked at component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** RadioGroup root — container for exclusive radio items */
export interface RadioGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	/** Currently selected value (bindable) */
	value?: string;
	children?: Snippet;
}

/** RadioGroup item — individual radio option button */
export interface RadioGroupItemProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	/** Value this item represents */
	value: string;
	children?: Snippet;
}

/** RadioGroup indicator — visual selection mark inside an item */
export interface RadioGroupIndicatorProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
