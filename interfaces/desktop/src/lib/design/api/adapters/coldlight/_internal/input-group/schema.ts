/**
 * @file InputGroup Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * InputGroup is ColdLight-owned — engine: "coldlight".
 *
 * Container that associates an input element with prefix and suffix
 * addon elements. Uses `role="group"` for ARIA grouping.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const InputGroupSchema = {
	kind: "input-group",
	engine: "coldlight",
	slots: ["root", "prefix", "input", "suffix"],
	states: ["disabled"],
	aria: ["aria-label", "aria-labelledby"],
	interactions: [],
} as const satisfies ComponentSchema;
