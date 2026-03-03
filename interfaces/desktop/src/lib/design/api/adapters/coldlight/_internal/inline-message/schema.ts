/**
 * @file InlineMessage Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * InlineMessage is ColdLight-owned — engine: "coldlight".
 *
 * Inline feedback message for form validation, help text, or status.
 * Root is a polite live region (`role="status"`, `aria-live`).
 * Icon is decorative (`aria-hidden`).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const InlineMessageSchema = {
	kind: "inline-message",
	engine: "coldlight",
	slots: ["root", "icon"],
	states: [],
	aria: ["aria-live", "aria-hidden"],
	interactions: [],
} as const satisfies ComponentSchema;
