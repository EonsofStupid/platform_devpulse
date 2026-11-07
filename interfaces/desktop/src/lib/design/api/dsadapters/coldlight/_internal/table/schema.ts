/**
 * @file Table Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the Table primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 *
 * Table uses semantic HTML <table> — native elements provide implicit ARIA roles.
 * aria-label, aria-labelledby, aria-describedby on root. aria-sort on head cells.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const TableSchema = {
	kind: "table",
	engine: "coldlight",
	slots: ["root", "header", "body", "row", "cell", "caption"],
	states: [],
	aria: ["role", "aria-label", "aria-labelledby", "aria-describedby", "aria-sort"],
	interactions: [],
} as const satisfies ComponentSchema;
