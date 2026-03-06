/**
 * @file api/adapters/meltui/_internal/fileupload/schema.ts
 * @package @devpulse/coldlight
 *
 * Component schema for the MeltUI FileUpload adapter.
 * Declares slots, states, ARIA attributes, and interactions.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const FileUploadSchema = {
	kind: "file-upload",
	engine: "meltui",
	slots: ["dropzone", "input", "trigger"],
	states: ["dragging", "disabled"],
	aria: [],
	interactions: [
		"click",
		"dragenter",
		"dragleave",
		"dragover",
		"drop",
		"change",
	],
} as const satisfies ComponentSchema;
