/**
 * @file PinInput Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI PinInput → ColdLight pin-input primitive contract.
 * This is the SSOT for how MeltUI's PinInput class fulfills ColdLight's
 * pin-input primitive specification.
 *
 * Scanner validates this against primitives/pin-input/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WIRING STATUS:
 * - Component at components/pin-input/ EXISTS with PinInput.svelte + types.ts
 * - Component currently renders a bare div with role="group" and defers to children
 *   snippet for individual inputs. It does NOT consume the MeltUI transport.
 * - Missing: contract.ts, recipe.ts, index.ts, tests
 * - TO WIRE: Component should import createPinInputTransport from the transport layer,
 *   spread transport.slots.root onto the root div (replacing hardcoded role="group"),
 *   iterate transport.slots.inputs and spread each onto an <input> element,
 *   and use transport.states.value / transport.states.isFilled for state tracking.
 *   MeltUI handles roving tabindex, backspace navigation, and paste-across behavior.
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "pin-input",
	source: "meltui",
	meltClass: "PinInput",
	meltImport: "melt/builders",
	compound: true,

	// ─── Root Slots ──────────────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "root",
			coldlightSlot: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
			states: ["disabled"],
			dataAttributes: ["data-cl-pin-input-root"],
		},
	},

	// ─── Per-Item Slots (compound) ───────────────────────────────────────────
	itemSlots: {
		input: {
			meltGetter: "inputs",
			coldlightSlot: "input",
			element: "input",
			aria: {
				role: "textbox",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
			states: ["focused", "focus-visible", "disabled"],
			dataAttributes: ["data-cl-pin-input-input"],
		},
	},

	// ─── Props ───────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "maxLength",
			coldlightProp: "length",
			type: "number",
			required: false,
			defaultValue: 4,
		},
		{
			meltProp: "placeholder",
			coldlightProp: "placeholder",
			type: "string",
			required: false,
			defaultValue: "\u25CB",
		},
		{
			meltProp: "disabled",
			coldlightProp: "disabled",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "mask",
			coldlightProp: "mask",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "type",
			coldlightProp: "type",
			type: '"text" | "numeric" | "alphanumeric"',
			required: false,
			defaultValue: "text",
		},
		{
			meltProp: "allowPaste",
			coldlightProp: "allowPaste",
			type: "boolean",
			required: false,
			defaultValue: true,
		},
	],

	// ─── Keyboard ────────────────────────────────────────────────────────────
	keyboard: [
		{ key: "ArrowLeft", action: "prev-input", description: "Move focus to previous input field", slot: "input" },
		{ key: "ArrowRight", action: "next-input", description: "Move focus to next input field", slot: "input" },
		{ key: "Backspace", action: "delete-prev", description: "Delete current value and move to previous input", slot: "input" },
		{ key: "Delete", action: "delete-current", description: "Delete current input value", slot: "input" },
		{ key: "Tab", action: "focus-next", description: "Move focus to next focusable element", slot: "input" },
	],
} as const satisfies AdapterContract<"pin-input">;
