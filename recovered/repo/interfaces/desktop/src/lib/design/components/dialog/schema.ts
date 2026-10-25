/**
 * @file Dialog Component Schema
 * @package @devpulse/coldlight
 *
 * FULL ARIA CONTRACT for the Dialog component.
 * AI-ready semantic description of all ARIA requirements.
 *
 * Reference: W3C WAI-ARIA APG Modal Dialog Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import { contract as primitiveContract } from "$lib/design/taxonomy/kinds/primitives/dialog/contract.js";
import type { ComponentContract, ComponentSlotContract } from "../schema.js";
import { parseComponentContract, validateComponentContract } from "../schema.js";

// =============================================================================
// SLOT CONTRACTS — Full ARIA requirements per sub-component
// =============================================================================

/**
 * Dialog Root slot — renderless context provider.
 * No ARIA attributes — delegates to child slots.
 */
export const dialogRootSlot: ComponentSlotContract = {
	name: "root",
	element: "fragment",
	aria: {
		role: undefined,
		required: [],
		optional: [],
		relationships: [],
	},
	data: {
		kind: "dialog",
		slot: "root",
		states: ["open", "closed"],
	},
	keyboard: [],
};

/**
 * Dialog Trigger slot — button that opens the dialog.
 * ARIA: role="button" (implicit), aria-haspopup="dialog", aria-expanded, aria-controls
 */
export const dialogTriggerSlot: ComponentSlotContract = {
	name: "trigger",
	element: "button",
	aria: {
		role: "button",
		required: [
			{ attr: "aria-haspopup", valueType: "aria-haspopup" },
			{ attr: "aria-expanded", valueType: "aria-expanded" },
		],
		optional: [
			{ attr: "aria-controls", valueType: "aria-controls" },
			{ attr: "aria-label", valueType: "aria-label" },
		],
		relationships: [{ attr: "aria-controls", targetSlot: "content", required: false }],
	},
	data: {
		kind: "dialog",
		slot: "trigger",
		states: ["focused", "focus-visible", "hover", "active"],
	},
	keyboard: [
		{ key: "Enter", action: "open", description: "Enter activates button to open dialog" },
		{ key: "Space", action: "open", description: "Space activates button to open dialog" },
	],
};

/**
 * Dialog Portal slot — container for portal rendering.
 * No ARIA — purely structural.
 */
export const dialogPortalSlot: ComponentSlotContract = {
	name: "portal",
	element: "div",
	aria: {
		role: undefined,
		required: [],
		optional: [],
		relationships: [],
	},
	data: {
		kind: "dialog",
		slot: "portal",
		states: ["hidden", "visible"],
	},
	keyboard: [],
};

/**
 * Dialog Overlay slot — backdrop behind dialog.
 * ARIA: aria-hidden (screen readers should ignore overlay).
 */
export const dialogOverlaySlot: ComponentSlotContract = {
	name: "overlay",
	element: "div",
	aria: {
		role: undefined,
		required: [],
		optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
		relationships: [],
	},
	data: {
		kind: "dialog",
		slot: "overlay",
		states: ["visible", "entering", "exiting", "hover"],
	},
	keyboard: [],
};

/**
 * Dialog Content slot — main dialog container.
 * ARIA: role="dialog", aria-modal="true", aria-labelledby (required), aria-describedby (optional)
 *
 * APG Requirements:
 * - MUST have role="dialog"
 * - MUST have aria-modal="true"
 * - MUST have accessible name via aria-labelledby or aria-label
 * - SHOULD have aria-describedby if description is present
 */
export const dialogContentSlot: ComponentSlotContract = {
	name: "content",
	element: "dialog",
	aria: {
		role: "dialog",
		required: [
			{ attr: "aria-modal", valueType: "aria-modal" },
			{ attr: "aria-labelledby", valueType: "aria-labelledby" },
		],
		optional: [
			{ attr: "aria-label", valueType: "aria-label" },
			{ attr: "aria-describedby", valueType: "aria-describedby" },
		],
		relationships: [
			{ attr: "aria-labelledby", targetSlot: "title", required: true },
			{ attr: "aria-describedby", targetSlot: "description", required: false },
		],
	},
	data: {
		kind: "dialog",
		slot: "content",
		states: ["open", "closed", "focus-within", "entering", "exiting"],
	},
	keyboard: [
		{ key: "Tab", action: "next-item", description: "Tab cycles focus within dialog (focus trap)" },
		{ key: "Escape", action: "close", description: "Escape closes the dialog" },
	],
};

/**
 * Dialog Title slot — accessible name for the dialog.
 * ARIA: None directly — referenced by content's aria-labelledby.
 * Element provides accessible name via text content.
 */
export const dialogTitleSlot: ComponentSlotContract = {
	name: "title",
	element: "h2",
	aria: {
		role: undefined,
		required: [],
		optional: [],
		relationships: [],
	},
	data: {
		kind: "dialog",
		slot: "title",
		states: [],
	},
	keyboard: [],
};

/**
 * Dialog Description slot — accessible description for the dialog.
 * ARIA: None directly — referenced by content's aria-describedby.
 */
export const dialogDescriptionSlot: ComponentSlotContract = {
	name: "description",
	element: "p",
	aria: {
		role: undefined,
		required: [],
		optional: [],
		relationships: [],
	},
	data: {
		kind: "dialog",
		slot: "description",
		states: [],
	},
	keyboard: [],
};

/**
 * Dialog Close slot — button that closes the dialog.
 * ARIA: role="button" (implicit), aria-label for icon-only buttons.
 */
export const dialogCloseSlot: ComponentSlotContract = {
	name: "close",
	element: "button",
	aria: {
		role: "button",
		required: [],
		optional: [{ attr: "aria-label", valueType: "aria-label" }],
		relationships: [],
	},
	data: {
		kind: "dialog",
		slot: "close",
		states: ["focused", "focus-visible", "hover", "active"],
	},
	keyboard: [
		{ key: "Enter", action: "close", description: "Enter activates close button" },
		{ key: "Space", action: "close", description: "Space activates close button" },
	],
};

// =============================================================================
// FULL COMPONENT CONTRACT — AI-introspectable semantic description
// =============================================================================

/**
 * Dialog Component Contract.
 *
 * Full ARIA semantics for AI agents to understand:
 * - What the component does (modal overlay pattern)
 * - How to interact with it (keyboard, focus)
 * - What ARIA attributes MUST/SHOULD be present
 * - Relationship graph between slots
 */
const rawContract = {
	kind: "dialog",
	description:
		"Modal dialog overlay that traps focus and blocks interaction with content behind it. " +
		"Used for critical user interactions requiring acknowledgment before continuing.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",

	slots: {
		required: ["root", "content"],
		optional: ["trigger", "portal", "overlay", "title", "description", "close"],
	},

	slotContracts: {
		root: dialogRootSlot,
		trigger: dialogTriggerSlot,
		portal: dialogPortalSlot,
		overlay: dialogOverlaySlot,
		content: dialogContentSlot,
		title: dialogTitleSlot,
		description: dialogDescriptionSlot,
		close: dialogCloseSlot,
	},

	accessibleName: {
		required: true,
		sources: ["aria-labelledby", "aria-label"],
		defaultSlot: "title",
	},

	focus: {
		strategy: "trap",
		initialFocus: "content", // First focusable within content
		returnFocus: "trigger", // Return to trigger on close
		trapContainer: "content", // Content is the focus trap boundary
	},

	keyboard: {
		global: [
			{
				key: "Escape",
				action: "close",
				description: "Escape closes the dialog and returns focus to trigger",
			},
			{
				key: "Tab",
				action: "next-item",
				description: "Tab cycles through focusable elements within dialog",
			},
		],
	},

	states: {
		primary: "open",
		all: [
			"open",
			"closed",
			"entering",
			"exiting",
			"focused",
			"focus-visible",
			"focus-within",
			"hover",
			"active",
			"hidden",
			"visible",
			"inert",
		],
		ariaMapping: {
			open: "aria-expanded",
		},
	},

	interactions: {
		modal: true,
		selectable: false,
		editable: false,
		expandable: true,
	},

	primitiveKind: "dialog",
} as const;

// =============================================================================
// VALIDATION — Ensure component contract matches primitive
// =============================================================================

export const contract: ComponentContract = parseComponentContract(rawContract);

// Validate against primitive contract at import time
const validation = validateComponentContract(contract, primitiveContract);
if (!validation.valid) {
	console.error("[Dialog Component Schema] Validation errors:", validation.errors);
}
