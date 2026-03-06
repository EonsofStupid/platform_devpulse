/**
 * @file RadioGroup Context — Svelte context for compound component communication
 * @kind radio-group
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 */

import { getContext, setContext } from "svelte";
import type { RadioGroupTransport } from "$lib/design/api/dsadapters/meltui/_internal/radio-group/index.js";

const RADIO_GROUP_CTX = Symbol("coldlight-radio-group");

export function setRadioGroupContext(transport: RadioGroupTransport): void {
	setContext(RADIO_GROUP_CTX, transport);
}

export function getRadioGroupContext(): RadioGroupTransport {
	return getContext<RadioGroupTransport>(RADIO_GROUP_CTX);
}
