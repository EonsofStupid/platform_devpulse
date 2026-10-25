/**
 * @file FileUpload Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI FileUpload → ColdLight file-upload primitive contract.
 * This is the SSOT for how MeltUI's FileUpload class fulfills ColdLight's
 * file-upload primitive specification.
 *
 * Scanner validates this against primitives/file-upload/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WIRING STATUS:
 * - Component at components/file-upload/ EXISTS with FileUpload.svelte + types.ts
 * - Component currently renders a basic div root with a hidden <input type="file"> and
 *   uses onchange directly. It does NOT consume the MeltUI transport at all.
 * - Missing: contract.ts, recipe.ts, index.ts, tests
 * - TO WIRE: Component should import createFileUploadTransport from the transport layer,
 *   spread transport.slots.dropzone onto the root div (for drag-and-drop),
 *   spread transport.slots.input onto the hidden input,
 *   spread transport.slots.trigger onto a trigger button,
 *   and use transport.states.isDragging / transport.states.selected for state.
 *   The trigger slot from the primitive contract is currently not rendered at all.
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "file-upload",
	source: "meltui",
	meltClass: "FileUpload",
	meltImport: "melt/builders",
	compound: true,

	// ─── Root Slots ──────────────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "dropzone",
			coldlightSlot: "root",
			element: "div",
			aria: {
				required: [],
				optional: ["aria-label"],
			},
			states: ["hover", "disabled"],
			dataAttributes: ["data-cl-file-upload-root"],
		},
		trigger: {
			meltGetter: "trigger",
			coldlightSlot: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
			states: ["focused", "focus-visible", "hover"],
			dataAttributes: ["data-cl-file-upload-trigger"],
		},
		hiddenInput: {
			meltGetter: "input",
			coldlightSlot: "hiddenInput",
			element: "input",
			aria: {
				required: [],
				optional: [],
			},
			states: [],
			dataAttributes: ["data-cl-file-upload-hidden-input"],
		},
	},

	// ─── Props ───────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "multiple",
			coldlightProp: "multiple",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "accept",
			coldlightProp: "accept",
			type: "string",
			required: false,
		},
		{
			meltProp: "maxSize",
			coldlightProp: "maxSize",
			type: "number",
			required: false,
		},
		{
			meltProp: "disabled",
			coldlightProp: "disabled",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "avoidDuplicates",
			coldlightProp: "avoidDuplicates",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
	],

	// ─── Keyboard ────────────────────────────────────────────────────────────
	keyboard: [
		{ key: "Enter", action: "open", description: "Open file picker dialog", slot: "trigger" },
		{ key: "Space", action: "open", description: "Open file picker dialog", slot: "trigger" },
	],
} as const satisfies AdapterContract<"file-upload">;
