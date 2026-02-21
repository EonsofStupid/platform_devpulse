/**
 * @file taxonomy/button/types.ts
 * @package @devpulse/coldlight
 *
 * Button primitive types.
 * All slot/state types derived from vocabularies.cfg.ts via kinds/primitives/types.ts.
 */

import type { Snippet } from "svelte";
import type { StateToken, SlotStateMap } from "../kinds/primitives/types.js";

// ─── SLOTS ───────────────────────────────────────────────────────────────────

export const buttonSlots = ["root", "icon", "label"] as const;
export type ButtonSlot = (typeof buttonSlots)[number];

// ─── STATES ──────────────────────────────────────────────────────────────────

export const buttonStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
	"pressed",
	"loading",
	"busy",
] as const satisfies readonly StateToken[];
export type ButtonState = (typeof buttonStateTokens)[number];

// ─── SLOT STATE MAP ───────────────────────────────────────────────────────────

export const buttonSlotStates = {
	root: ["focused", "focus-visible", "hover", "active", "disabled", "pressed", "loading", "busy"],
	icon: [],
	label: [],
} as const satisfies SlotStateMap<ButtonSlot, ButtonState>;

// ─── BUTTON TYPE ──────────────────────────────────────────────────────────────

export type ButtonType = "button" | "submit" | "reset";

// ─── PROPS ───────────────────────────────────────────────────────────────────

/**
 * ButtonProps — ColdLight-owned primitive.
 *
 * The `class` prop receives recipe output from the component layer.
 * The primitive applies no styling itself.
 */
export interface ButtonProps {
	/** Disables interaction. Sets aria-disabled, data-state="disabled". */
	disabled?: boolean;
	/** Loading state. Sets aria-busy, data-state="loading". */
	loading?: boolean;
	/** Toggle pressed state. Sets aria-pressed, data-state="pressed". */
	pressed?: boolean;
	/** HTML button type attribute. */
	type?: ButtonType;
	/** Accessible label when no visible text content. */
	"aria-label"?: string;
	/** References element that describes the button. */
	"aria-describedby"?: string;
	/** Click handler. */
	onclick?: (event: MouseEvent) => void;
	/** Recipe-generated class string. Applied to root element. */
	class?: string;
	/** Button content (icons, labels, or both). */
	children?: Snippet;
}
