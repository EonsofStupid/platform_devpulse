/**
 * @file primitives/command-palette/types.ts
 * @kind command-palette
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Command palette primitive — dialog + combobox composition for command search.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new CommandPalette() (composes Dialog + Combobox).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the command-palette primitive */
export const commandPaletteSlots = [
	"root",
	"input",
	"list",
	"item",
	"group",
	"separator",
	"empty",
] as const;
export type CommandPaletteSlot = (typeof commandPaletteSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the command-palette primitive */
export const commandPaletteStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
	"open",
	"closed",
	"selected",
] as const satisfies readonly StateToken[];
export type CommandPaletteState = (typeof commandPaletteStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each command-palette slot to its allowed state tokens */
export const commandPaletteSlotStates = {
	root: ["open", "closed"],
	input: ["focused", "focus-visible"],
	list: [],
	item: ["selected", "focused", "disabled"],
	group: [],
	separator: [],
	empty: [],
} as const satisfies SlotStateMap<CommandPaletteSlot, CommandPaletteState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/** Props for the command-palette root slot */
export interface CommandPaletteRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the command-palette input slot (self-closing, no children) */
export interface CommandPaletteInputProps
	extends Omit<HTMLInputAttributes, "style" | "children">,
		BaseProps {}

/** Props for the command-palette item slot */
export interface CommandPaletteItemProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
