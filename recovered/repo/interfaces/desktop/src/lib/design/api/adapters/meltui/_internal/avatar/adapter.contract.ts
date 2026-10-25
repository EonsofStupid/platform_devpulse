/**
 * @file Avatar Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Avatar → ColdLight avatar primitive contract.
 * This is the SSOT for how MeltUI's Avatar class fulfills ColdLight's
 * avatar primitive specification.
 *
 * Scanner validates this against primitives/avatar/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WIRING STATUS:
 * - Component at components/avatar/ EXISTS with Avatar.svelte, contract.ts, recipe.ts, etc.
 * - Component currently manages load state internally (loadState $state) and renders
 *   ARIA directly (role="img", aria-label, aria-hidden) WITHOUT consuming the MeltUI transport.
 * - TO WIRE: Component should import createAvatarTransport from the transport layer,
 *   spread transport.slots.image / transport.slots.fallback onto the <img>/<span> elements,
 *   and use transport.states.loadingStatus instead of internal loadState tracking.
 *   The component hardcodes ARIA today; transport should provide it instead.
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "avatar",
	source: "meltui",
	meltClass: "Avatar",
	meltImport: "melt/builders",
	compound: false,

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "root",
			coldlightSlot: "root",
			element: "span",
			aria: {
				role: "img",
				required: [],
				optional: ["aria-label"],
			},
			states: [],
			dataAttributes: ["data-cl-avatar-root"],
		},
		image: {
			meltGetter: "image",
			coldlightSlot: "image",
			element: "img",
			aria: {
				required: [],
				optional: ["aria-hidden"],
			},
			states: ["loading"],
			dataAttributes: ["data-cl-avatar-image"],
		},
		fallback: {
			meltGetter: "fallback",
			coldlightSlot: "fallback",
			element: "span",
			aria: {
				required: [],
				optional: ["aria-hidden"],
			},
			states: [],
			dataAttributes: ["data-cl-avatar-fallback"],
		},
	},

	// ─── Props ───────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "src",
			coldlightProp: "src",
			type: "string",
			required: false,
		},
		{
			meltProp: "delayMs",
			coldlightProp: "delayMs",
			type: "number",
			required: false,
			defaultValue: 0,
		},
	],

	// ─── Keyboard (Avatar: no keyboard interaction) ──────────────────────────
	keyboard: [],
} as const satisfies AdapterContract<"avatar">;
