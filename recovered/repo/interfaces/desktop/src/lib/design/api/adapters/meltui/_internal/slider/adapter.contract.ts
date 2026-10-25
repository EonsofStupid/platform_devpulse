/**
 * @file Slider Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Slider → ColdLight slider primitive contract.
 * This is the SSOT for how MeltUI's Slider class fulfills ColdLight's
 * slider primitive specification.
 *
 * Scanner validates this against primitives/slider/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "slider",
	source: "meltui",
	meltClass: "Slider",
	meltImport: "melt/builders",
	compound: true,

	// ─── Slots ──────────────────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "root",
			coldlightSlot: "root",
			element: "div",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
			states: ["disabled"],
			dataAttributes: ["data-cl-slider-root"],
		},
		thumb: {
			meltGetter: "thumb",
			coldlightSlot: "thumb",
			element: "span",
			aria: {
				role: "slider",
				required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
				optional: ["aria-label", "aria-valuetext", "aria-orientation", "aria-disabled"],
			},
			states: ["focused", "focus-visible", "hover", "disabled"],
			dataAttributes: ["data-cl-slider-thumb"],
		},
		range: {
			meltGetter: "range",
			coldlightSlot: "range",
			element: "span",
			aria: {
				required: [],
				optional: [],
			},
			states: [],
			dataAttributes: ["data-cl-slider-range"],
		},
	},

	// ─── Props ──────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "min",
			coldlightProp: "min",
			type: "number",
			required: false,
			defaultValue: 0,
		},
		{
			meltProp: "max",
			coldlightProp: "max",
			type: "number",
			required: false,
			defaultValue: 100,
		},
		{
			meltProp: "value",
			coldlightProp: "value",
			type: "number",
			required: false,
			defaultValue: 0,
		},
		{
			meltProp: "step",
			coldlightProp: "step",
			type: "number",
			required: false,
			defaultValue: 1,
		},
		{
			meltProp: "orientation",
			coldlightProp: "orientation",
			type: "'horizontal' | 'vertical'",
			required: false,
			defaultValue: "horizontal",
		},
		{
			meltProp: "onValueChange",
			coldlightProp: "onValueChange",
			type: "(value: number) => void",
			required: false,
		},
	],

	// ─── Keyboard ───────────────────────────────────────────────────────────
	keyboard: [
		{ key: "ArrowUp", action: "increment", description: "Increment slider value", slot: "thumb" },
		{ key: "ArrowDown", action: "decrement", description: "Decrement slider value", slot: "thumb" },
		{ key: "ArrowLeft", action: "decrement", description: "Decrement slider value", slot: "thumb" },
		{ key: "ArrowRight", action: "increment", description: "Increment slider value", slot: "thumb" },
		{ key: "Home", action: "set-min", description: "Set slider to minimum value", slot: "thumb" },
		{ key: "End", action: "set-max", description: "Set slider to maximum value", slot: "thumb" },
		{ key: "PageUp", action: "increment-large", description: "Increment slider by large step", slot: "thumb" },
		{ key: "PageDown", action: "decrement-large", description: "Decrement slider by large step", slot: "thumb" },
	],
} as const satisfies AdapterContract<"slider">;
