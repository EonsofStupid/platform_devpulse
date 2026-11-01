/**
 * @file primitives/file-upload/contract.ts
 * @kind file-upload
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * File-upload PrimitiveContract — SSOT declaration for the file-upload primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA + state via transport chain.
 *   3-folder parity enforced by scanner.
 *
 * Builder: new FileUpload()
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { FileUploadSlot, FileUploadState } from "./types.js";

export const contract = {
	kind: "file-upload",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "trigger", "hiddenInput"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-label"],
			},
		},
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		hiddenInput: {
			element: "input",
			children: "self-closing",
			aria: {
				required: [],
				optional: [],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: [],
	},

	slotStates: {
		root: ["hover", "disabled"],
		trigger: ["focused", "focus-visible", "hover"],
		hiddenInput: [],
	},

	slotActions: {
		root: [],
		trigger: ["open"],
		hiddenInput: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: ["Enter", "Space"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"file-upload", FileUploadSlot, FileUploadState>;
