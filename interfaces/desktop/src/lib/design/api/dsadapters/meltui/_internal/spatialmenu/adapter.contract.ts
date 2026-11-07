/**
 * @file SpatialMenu Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI SpatialMenu → ColdLight spatial navigation pattern.
 * SpatialMenu is an internal adapter — it provides 2D proximity-based
 * keyboard navigation for grid-like menu layouts.
 *
 * This is NOT a user-facing primitive — it's used internally by other
 * components that need spatial navigation (e.g., command palette grid mode).
 *
 * MeltUI SpatialMenu uses DOMRect measurements to determine nearest
 * items in cardinal directions (Arrow keys navigate by proximity).
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "spatialmenu",
	source: "meltui",
	meltClass: "SpatialMenu",
	meltImport: "melt/builders",
	compound: true,

	// ─── Slots ──────────────────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "root",
			coldlightSlot: "root",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			states: [],
			dataAttributes: ["data-cl-spatialmenu-root"],
		},
		input: {
			meltGetter: "input",
			coldlightSlot: "input",
			element: "input",
			aria: {
				required: [],
				optional: [],
			},
			states: ["focused"],
			dataAttributes: ["data-cl-spatialmenu-input"],
		},
	},

	// ─── Item Slots (per menu item via getItem()) ───────────────────────────
	itemSlots: {
		item: {
			meltGetter: "getItem",
			coldlightSlot: "item",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			states: ["highlighted", "disabled"],
			dataAttributes: ["data-cl-spatialmenu-item"],
		},
	},

	// ─── Props ──────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "highlighted",
			coldlightProp: "highlighted",
			type: "T | null",
			required: false,
			defaultValue: null,
		},
		{
			meltProp: "onHighlightChange",
			coldlightProp: "onHighlightChange",
			type: "(highlighted: T | null) => void",
			required: false,
		},
		{
			meltProp: "onSelect",
			coldlightProp: "onSelect",
			type: "(value: T) => void",
			required: false,
		},
		{
			meltProp: "wrap",
			coldlightProp: "wrap",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "crossAxis",
			coldlightProp: "crossAxis",
			type: "boolean",
			required: false,
			defaultValue: true,
		},
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "ArrowUp", action: "navigateUp", description: "Navigate to nearest item above", slot: "root" },
		{ key: "ArrowDown", action: "navigateDown", description: "Navigate to nearest item below", slot: "root" },
		{ key: "ArrowLeft", action: "navigateLeft", description: "Navigate to nearest item left", slot: "root" },
		{ key: "ArrowRight", action: "navigateRight", description: "Navigate to nearest item right", slot: "root" },
		{ key: "Enter", action: "select", description: "Select highlighted item", slot: "root" },
	],
} as const satisfies AdapterContract<"spatialmenu">;
