/**
 * @file Button Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Scanner validates: if engine is "meltui", adapter folder MUST exist.
 * Button is ColdLight-owned — engine: "coldlight".
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ButtonSchema = {
	kind: "button",
	engine: "coldlight",
	slots: ["root"],
	states: ["disabled", "pressed", "loading", "expanded"],
	aria: ["aria-disabled", "aria-pressed", "aria-expanded", "aria-busy"],
	interactions: ["click", "keydown.enter", "keydown.space"],
} as const satisfies ComponentSchema;
