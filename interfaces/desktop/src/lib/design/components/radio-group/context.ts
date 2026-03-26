/**
 * @file RadioGroup Context
 * @kind radio-group
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { UseRadioGroupReturn } from "$lib/design/behaviors/radio-group/radio-group.types.js";

export interface RadioGroupContext {
	readonly hook: UseRadioGroupReturn;
}

const RADIO_GROUP_CTX = Symbol("coldlight-radio-group");

export function setRadioGroupContext(ctx: RadioGroupContext): void {
	setContext(RADIO_GROUP_CTX, ctx);
}

export function getRadioGroupContext(): RadioGroupContext {
	return getContext<RadioGroupContext>(RADIO_GROUP_CTX);
}
