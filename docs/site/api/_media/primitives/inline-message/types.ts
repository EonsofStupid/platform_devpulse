/**
 * @file primitives/inline-message/types.ts
 * @kind inline-message
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * InlineMessage primitive — inline validation/help text for forms.
 *
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const inlineMessageSlots = ["root", "icon"] as const;
export type InlineMessageSlot = (typeof inlineMessageSlots)[number];

export const inlineMessageStateTokens = [] as const satisfies readonly StateToken[];
export type InlineMessageState = (typeof inlineMessageStateTokens)[number];

export const inlineMessageSlotStates = {
	root: [],
	icon: [],
} as const satisfies SlotStateMap<InlineMessageSlot, InlineMessageState>;

export interface InlineMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
