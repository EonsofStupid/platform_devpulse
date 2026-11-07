/**
 * @file Toaster Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Toaster → ColdLight toaster primitive contract.
 * This is the SSOT for how MeltUI's Toaster class fulfills ColdLight's
 * toaster primitive specification.
 *
 * Scanner validates this against primitives/toaster/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WIRING STATUS:
 * - Component at components/toaster/ EXISTS with Toaster.svelte + types.ts
 * - Component currently renders a div with hardcoded aria-label="Notifications"
 *   and role="region". It defers toast rendering to a children snippet.
 *   It does NOT consume the MeltUI transport.
 * - Missing: contract.ts, recipe.ts, index.ts, tests
 * - TO WIRE: Component should import createToasterTransport from the transport layer,
 *   spread transport.slots.root onto the root div (melt provides popover="manual",
 *   data-melt-* attrs), iterate transport.states.toasts and spread each toast's
 *   .content, .title, .description, .close slots onto the respective elements.
 *   Expose transport.addToast for programmatic toast creation.
 *   Remove hardcoded aria-label/role — transport should provide them.
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "toaster",
	source: "meltui",
	meltClass: "Toaster",
	meltImport: "melt/builders",
	compound: true,

	// ─── Root Slots ──────────────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "root",
			coldlightSlot: "root",
			element: "div",
			aria: {
				role: "region",
				required: ["aria-label"],
				optional: ["aria-live"],
			},
			states: [],
			dataAttributes: ["data-cl-toaster-root"],
		},
	},

	// ─── Per-Toast Slots (compound) ──────────────────────────────────────────
	itemSlots: {
		content: {
			meltGetter: "toast.content",
			coldlightSlot: "content",
			element: "div",
			aria: {
				role: "status",
				required: [],
				optional: ["aria-live", "aria-atomic"],
			},
			states: ["open", "closed"],
			dataAttributes: ["data-cl-toaster-content"],
		},
		title: {
			meltGetter: "toast.title",
			coldlightSlot: "title",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			states: [],
			dataAttributes: ["data-cl-toaster-title"],
		},
		description: {
			meltGetter: "toast.description",
			coldlightSlot: "description",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			states: [],
			dataAttributes: ["data-cl-toaster-description"],
		},
		close: {
			meltGetter: "toast.close",
			coldlightSlot: "close",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
			states: ["focused", "focus-visible"],
			dataAttributes: ["data-cl-toaster-close"],
		},
	},

	// ─── Props ───────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "closeDelay",
			coldlightProp: "closeDelay",
			type: "number",
			required: false,
			defaultValue: 5000,
		},
		{
			meltProp: "type",
			coldlightProp: "type",
			type: '"assertive" | "polite"',
			required: false,
			defaultValue: "polite",
		},
		{
			meltProp: "hover",
			coldlightProp: "hover",
			type: '"pause" | "pause-all" | null',
			required: false,
			defaultValue: "pause",
		},
		{
			meltProp: "tabHidden",
			coldlightProp: "tabHidden",
			type: '"pause-all" | null',
			required: false,
			defaultValue: "pause-all",
		},
	],

	// ─── Keyboard ────────────────────────────────────────────────────────────
	keyboard: [
		{ key: "Escape", action: "dismiss", description: "Dismiss the focused toast notification", slot: "content" },
	],
} as const satisfies AdapterContract<"toaster">;
