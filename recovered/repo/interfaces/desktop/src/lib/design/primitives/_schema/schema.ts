/**
 * @file Primitive Foundation Schemas
 * @package @devpulse/coldlight
 *
 * Shared Zod schemas consumed by both primitive and component contracts.
 * These define the vocabulary: ARIA roles, attributes, keyboard keys, states.
 *
 * Reference: W3C WAI-ARIA 1.2 (https://www.w3.org/TR/wai-aria-1.2/)
 */

import { z } from "zod";

// =============================================================================
// ARIA ROLES — All WAI-ARIA 1.2 roles
// =============================================================================

export const AriaRoleValues = [
	// Widget roles
	"button",
	"checkbox",
	"combobox",
	"dialog",
	"grid",
	"gridcell",
	"link",
	"listbox",
	"menu",
	"menubar",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"option",
	"progressbar",
	"radio",
	"radiogroup",
	"scrollbar",
	"searchbox",
	"separator",
	"slider",
	"spinbutton",
	"switch",
	"tab",
	"tablist",
	"tabpanel",
	"textbox",
	"toolbar",
	"tooltip",
	"tree",
	"treegrid",
	"treeitem",
	// Document structure roles
	"alert",
	"alertdialog",
	"application",
	"article",
	"banner",
	"blockquote",
	"caption",
	"cell",
	"code",
	"columnheader",
	"complementary",
	"contentinfo",
	"definition",
	"deletion",
	"directory",
	"document",
	"emphasis",
	"feed",
	"figure",
	"form",
	"group",
	"heading",
	"img",
	"insertion",
	"list",
	"listitem",
	"log",
	"main",
	"marquee",
	"math",
	"meter",
	"navigation",
	"none",
	"note",
	"paragraph",
	"presentation",
	"region",
	"row",
	"rowgroup",
	"rowheader",
	"search",
	"status",
	"strong",
	"subscript",
	"superscript",
	"table",
	"term",
	"time",
	"timer",
] as const;
export const AriaRoleSchema = z.enum(AriaRoleValues);
export type AriaRole = z.infer<typeof AriaRoleSchema>;

// =============================================================================
// ARIA ATTRIBUTES — All WAI-ARIA 1.2 attributes
// =============================================================================

export const AriaAttributeValues = [
	// Relationship
	"aria-activedescendant",
	"aria-controls",
	"aria-describedby",
	"aria-details",
	"aria-flowto",
	"aria-labelledby",
	"aria-owns",
	// State
	"aria-checked",
	"aria-disabled",
	"aria-expanded",
	"aria-hidden",
	"aria-invalid",
	"aria-pressed",
	"aria-selected",
	// Property
	"aria-autocomplete",
	"aria-errormessage",
	"aria-haspopup",
	"aria-label",
	"aria-level",
	"aria-modal",
	"aria-multiline",
	"aria-multiselectable",
	"aria-orientation",
	"aria-placeholder",
	"aria-readonly",
	"aria-required",
	"aria-sort",
	"aria-valuemax",
	"aria-valuemin",
	"aria-valuenow",
	"aria-valuetext",
	"aria-roledescription",
	// Live region
	"aria-atomic",
	"aria-busy",
	"aria-live",
	"aria-relevant",
	// Position/set
	"aria-colcount",
	"aria-colindex",
	"aria-colspan",
	"aria-posinset",
	"aria-rowcount",
	"aria-rowindex",
	"aria-rowspan",
	"aria-setsize",
	// ARIA 1.3
	"aria-description",
	"aria-braillelabel",
	"aria-brailleroledescription",
] as const;
export const AriaAttributeSchema = z.enum(AriaAttributeValues);
export type AriaAttribute = z.infer<typeof AriaAttributeSchema>;

// =============================================================================
// KEYBOARD KEYS — Standard keyboard interaction keys
// =============================================================================

export const KeyboardKeyValues = [
	"Enter",
	"Space",
	"Escape",
	"Tab",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Home",
	"End",
	"PageUp",
	"PageDown",
	"Delete",
	"Backspace",
] as const;
export const KeyboardKeySchema = z.enum(KeyboardKeyValues);
export type KeyboardKey = z.infer<typeof KeyboardKeySchema>;

// =============================================================================
// STATE TOKENS — Component state identifiers
// =============================================================================

export const StateTokenValues = [
	"open",
	"closed",
	"active",
	"inactive",
	"selected",
	"unselected",
	"checked",
	"unchecked",
	"indeterminate",
	"disabled",
	"enabled",
	"focused",
	"pressed",
	"expanded",
	"collapsed",
	"hidden",
	"visible",
	"loading",
	"error",
	"valid",
	"invalid",
	"idle",
	"hover",
	"dragging",
] as const;
export const StateTokenSchema = z.enum(StateTokenValues);
export type StateToken = z.infer<typeof StateTokenSchema>;

// =============================================================================
// FOCUS STRATEGY — Re-exported from coldlight/schema for backward compat
// =============================================================================

export { FocusStrategySchema } from "../../coldlight/schema/a11y.schema.js";
export type { FocusStrategy } from "../../coldlight/schema/a11y.schema.js";
