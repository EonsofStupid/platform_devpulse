/**
 * @file FileUpload Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const FileUploadSchema = {
	kind: "file-upload",
	engine: "meltui",
	slots: ["root", "trigger", "hiddenInput"],
	states: ["hover", "disabled", "focused", "focus-visible"],
	aria: ["aria-label", "aria-disabled"],
	interactions: ["click", "keydown", "drop"],

	meltui: {
		meltClass: "FileUpload",
		meltImport: "melt/builders",
		compound: true,

		slotMapping: {
			root: {
				meltGetter: "dropzone",
				coldlightSlot: "root",
				element: "div",
				aria: { required: [], optional: ["aria-label"] },
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
				aria: { required: [], optional: [] },
				states: [],
				dataAttributes: ["data-cl-file-upload-hidden-input"],
			},
		},

		propMapping: [
			{ meltProp: "multiple", coldlightProp: "multiple", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "accept", coldlightProp: "accept", type: "string", required: false },
			{ meltProp: "maxSize", coldlightProp: "maxSize", type: "number", required: false },
			{ meltProp: "disabled", coldlightProp: "disabled", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "avoidDuplicates", coldlightProp: "avoidDuplicates", type: "boolean", required: false, defaultValue: false },
		],

		keyboardMapping: [
			{ key: "Enter", action: "open", description: "Open file picker", slot: "trigger" },
			{ key: "Space", action: "open", description: "Open file picker", slot: "trigger" },
		],
	},
} as const;
