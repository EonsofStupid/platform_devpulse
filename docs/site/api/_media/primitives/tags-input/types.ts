/**
 * @file primitives/tags-input/types.ts
 * @kind tags-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tags Input primitive — composite widget with editable tags.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new TagsInput().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const tagsInputSlots = ["root", "tag", "tag-delete", "input"] as const;
export type TagsInputSlot = (typeof tagsInputSlots)[number];

export const tagsInputStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
	"invalid",
	"selected",
] as const satisfies readonly StateToken[];
export type TagsInputState = (typeof tagsInputStateTokens)[number];

export const tagsInputSlotStates = {
	root: ["focused", "focus-visible", "disabled", "invalid"],
	tag: ["selected", "focused", "disabled"],
	"tag-delete": ["focused", "focus-visible"],
	input: ["focused", "focus-visible", "disabled", "invalid"],
} as const satisfies SlotStateMap<TagsInputSlot, TagsInputState>;

export interface TagsInputRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface TagsInputTagProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface TagsInputTagDeleteProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface TagsInputInputProps extends Omit<HTMLInputAttributes, "style" | "children">, BaseProps {}
