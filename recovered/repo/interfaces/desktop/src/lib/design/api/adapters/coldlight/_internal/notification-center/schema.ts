/**
 * @file NotificationCenter Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * Declares the NotificationCenter primitive's slots, states, ARIA, and interactions.
 * Engine: "coldlight" — ColdLight-owned builder provides all semantics.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const NotificationCenterSchema = {
	kind: "notification-center",
	engine: "coldlight",
	slots: ["root", "header", "list", "item", "action", "empty"],
	states: ["open"],
	aria: ["aria-live", "aria-relevant", "aria-label", "aria-labelledby", "role"],
	interactions: ["keydown.escape"],
} as const satisfies ComponentSchema;
