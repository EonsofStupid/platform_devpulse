/**
 * @file RadioGroup Primitive Context
 * @description Svelte context for compound radio-group coordination.
 * Two context levels: group (selected value) and item (this item's value).
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const GROUP_KEY = Symbol("coldlight:radio-group");
const ITEM_KEY = Symbol("coldlight:radio-group-item");

/** RadioGroup context shape — group-level selected value */
export type RadioGroupContext = {
	readonly value: string | undefined;
};

/** RadioGroupItem context shape — item-level checked state */
export type RadioGroupItemContext = {
	readonly checked: boolean;
};

/** Set radio-group context — called by RadioGroup root */
export function setRadioGroupContext(ctx: RadioGroupContext): void {
	setContext(GROUP_KEY, ctx);
}

/** Get radio-group context — called by RadioGroupItem */
export function getRadioGroupContext(): RadioGroupContext {
	return getContext<RadioGroupContext>(GROUP_KEY);
}

/** Set radio-group-item context — called by RadioGroupItem */
export function setRadioGroupItemContext(ctx: RadioGroupItemContext): void {
	setContext(ITEM_KEY, ctx);
}

/** Get radio-group-item context — called by RadioGroupIndicator */
export function getRadioGroupItemContext(): RadioGroupItemContext {
	return getContext<RadioGroupItemContext>(ITEM_KEY);
}
