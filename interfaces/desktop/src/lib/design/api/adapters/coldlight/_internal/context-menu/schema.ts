/**
 * @file ContextMenu Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * ContextMenu is ColdLight-owned — engine: "coldlight".
 *
 * Slots: trigger, content, item, separator.
 * States: open.
 * ARIA: role="menu", role="menuitem", role="separator", aria-label,
 *       aria-disabled.
 * Interactions: contextmenu, click, keydown.enter, keydown.space,
 *               keydown.escape, keydown.arrowdown, keydown.arrowup,
 *               keydown.home, keydown.end.
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ContextMenuSchema = {
	kind: "context-menu",
	engine: "coldlight",
	slots: ["trigger", "content", "item", "separator"],
	states: ["open"],
	aria: ["role=menu", "role=menuitem", "role=separator", "aria-label", "aria-disabled"],
	interactions: [
		"contextmenu",
		"click",
		"keydown.enter",
		"keydown.space",
		"keydown.escape",
		"keydown.arrowdown",
		"keydown.arrowup",
		"keydown.home",
		"keydown.end",
	],
} as const satisfies ComponentSchema;
