/**
 * @file NumberInput Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the NumberInput primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const NumberInputSchema = {
	kind: "number-input",
	engine: "coldlight",
	slots: ["root", "input", "increment", "decrement"],
	states: ["disabled"],
	aria: [
		"aria-label",
		"aria-valuenow",
		"aria-valuemin",
		"aria-valuemax",
		"aria-valuetext",
		"aria-disabled",
		"aria-readonly",
		"aria-required",
		"aria-describedby",
		"role",
	],
	interactions: [
		"keydown.arrowup",
		"keydown.arrowdown",
		"keydown.home",
		"keydown.end",
		"click.increment",
		"click.decrement",
		"input",
	],
} as const satisfies ComponentSchema;
