/**
 * @file Dialog Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * Dialog is ColdLight-owned — engine: "coldlight".
 *
 * Full modal dialog with trigger, overlay, content, title, description,
 * and close button slots. Uses native `<dialog>` element with `showModal()`.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const DialogSchema = {
	kind: "dialog",
	engine: "coldlight",
	slots: ["trigger", "content", "overlay", "portal", "title", "description", "close"],
	states: ["open"],
	aria: ["aria-haspopup", "aria-expanded", "aria-controls", "aria-modal", "aria-labelledby", "aria-describedby", "aria-hidden"],
	interactions: ["click", "keydown.escape"],
} as const satisfies ComponentSchema;
