/**
 * @file primitives/avatar/types.ts
 * @kind avatar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Avatar primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter owns ARIA via transport chain.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLImgAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the avatar primitive */
export const avatarSlots = ["root", "image", "fallback"] as const;
export type AvatarSlot = (typeof avatarSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the avatar primitive */
export const avatarStateTokens = [
	"loading",
	"pending",
] as const satisfies readonly StateToken[];
export type AvatarState = (typeof avatarStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each avatar slot to its allowed state tokens */
export const avatarSlotStates = {
	root: [],
	image: ["loading"],
	fallback: [],
} as const satisfies SlotStateMap<AvatarSlot, AvatarState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * AvatarRootProps — props for the avatar root container.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface AvatarRootProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * AvatarImageProps — props for the avatar image element.
 */
export interface AvatarImageProps extends Omit<HTMLImgAttributes, "style" | "children">, BaseProps {
	/** Image source URL */
	src: string;
	/** Alt text for accessibility */
	alt: string;
}

/**
 * AvatarFallbackProps — props for the avatar fallback content.
 */
export interface AvatarFallbackProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
