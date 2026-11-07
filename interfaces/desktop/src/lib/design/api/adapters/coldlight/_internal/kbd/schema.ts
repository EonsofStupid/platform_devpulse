/**
 * @file Kbd Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Kbd is ColdLight-owned — engine: "coldlight".
 *
 * Display-only primitive for keyboard shortcut indicators.
 * Native `<kbd>` element provides implicit keyboard input semantics
 * without requiring explicit ARIA attributes.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const KbdSchema = {
	kind: "kbd",
	engine: "coldlight",
	slots: ["root"],
	states: [],
	aria: [],
	interactions: [],
} as const satisfies ComponentSchema;
