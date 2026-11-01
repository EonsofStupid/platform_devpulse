/**
 * @file primitives/link-preview/types.ts
 * @kind link-preview
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Link Preview primitive — tooltip-like hover preview.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new LinkPreview().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLAnchorAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const linkPreviewSlots = ["trigger", "content"] as const;
export type LinkPreviewSlot = (typeof linkPreviewSlots)[number];

export const linkPreviewStateTokens = [
	"focused",
	"focus-visible",
	"open",
	"closed",
] as const satisfies readonly StateToken[];
export type LinkPreviewState = (typeof linkPreviewStateTokens)[number];

export const linkPreviewSlotStates = {
	trigger: ["focused", "focus-visible"],
	content: ["open", "closed"],
} as const satisfies SlotStateMap<LinkPreviewSlot, LinkPreviewState>;

export interface LinkPreviewTriggerProps extends Omit<HTMLAnchorAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface LinkPreviewContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
