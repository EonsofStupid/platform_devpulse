/**
 * @file Textarea Taxonomy Types
 * @description Type vocabulary for the textarea primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "textarea"
 * ariaStateProvider: "coldlight" — native <textarea> handles semantics.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the textarea primitive */
export const textareaSlots = ["root"] as const;

/** Union of textarea slot names */
export type TextareaSlot = (typeof textareaSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the textarea primitive */
export const textareaStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
	"readonly",
	"invalid",
	"valid",
	"required",
] as const satisfies readonly StateToken[];

/** Union of textarea state tokens */
export type TextareaState = (typeof textareaStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for textarea */
export const textareaSlotStates = {
	root: [
		"focused",
		"focus-visible",
		"hover",
		"active",
		"disabled",
		"readonly",
		"invalid",
		"valid",
		"required",
	],
} as const satisfies SlotStateMap<TextareaSlot, TextareaState>;
