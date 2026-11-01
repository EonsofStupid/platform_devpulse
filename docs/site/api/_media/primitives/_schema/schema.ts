/**
 * @file Primitive Schema — Zod Enum Definitions
 * @package @devpulse/coldlight
 *
 * SINGLE SOURCE OF TRUTH for all Zod-validated vocabularies used by primitive contracts.
 * Every enum, const array, and atomic schema lives here.
 * Composite schemas (SlotSpec, PrimitiveContractSchema) are in contract.ts.
 *
 * Pattern: as const array → z.enum() → z.infer<> type
 * Powers: CSS generation, manifest output, dev tool validation, DTCG tokens, SD5 alignment.
 *
 * Reference: W3C WAI-ARIA 1.2 (https://www.w3.org/WAI/ARIA/apg/)
 */

import { z } from "zod";

// =============================================================================
// ARIA ROLES — W3C WAI-ARIA 1.2 Official Spec
// =============================================================================

/** Widget roles from WAI-ARIA 1.2 */
export const AriaWidgetRoles = [
	"button",
	"checkbox",
	"combobox",
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
] as const;

/** Document structure roles from WAI-ARIA 1.2 */
export const AriaDocumentRoles = [
	"dialog",
	"alertdialog",
	"alert",
	"group",
	"img",
	"log",
	"navigation",
	"note",
	"region",
	"status",
	"timer",
	"article",
	"definition",
	"directory",
	"document",
	"feed",
	"figure",
	"heading",
	"list",
	"listitem",
	"math",
	"paragraph",
	"term",
] as const;

/** Landmark roles from WAI-ARIA 1.2 */
export const AriaLandmarkRoles = [
	"banner",
	"complementary",
	"contentinfo",
	"form",
	"main",
	"navigation",
	"region",
	"search",
] as const;

/** Presentation roles */
export const AriaPresentationRoles = ["none", "presentation"] as const;

/** All ARIA roles combined */
export const AriaRoles = [
	...AriaWidgetRoles,
	...AriaDocumentRoles,
	...AriaLandmarkRoles,
	...AriaPresentationRoles,
] as const;

// Zod schema for ARIA roles
export const AriaRoleSchema = z.enum(AriaRoles);
export type AriaRole = z.infer<typeof AriaRoleSchema>;

// =============================================================================
// ARIA ATTRIBUTES — W3C WAI-ARIA 1.2 Official Spec
// =============================================================================

/** Relationship attributes - connect elements to each other */
export const AriaRelationshipAttrs = [
	"aria-activedescendant",
	"aria-controls",
	"aria-describedby",
	"aria-details",
	"aria-flowto",
	"aria-labelledby",
	"aria-owns",
] as const;

/** State attributes - boolean/tristate values that change */
export const AriaStateAttrs = [
	"aria-checked",
	"aria-current",
	"aria-disabled",
	"aria-expanded",
	"aria-hidden",
	"aria-invalid",
	"aria-pressed",
	"aria-selected",
] as const;

/** Property attributes - characteristics that rarely change */
export const AriaPropertyAttrs = [
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
	"aria-keyshortcuts",
] as const;

/** Drag and drop attributes (deprecated in ARIA 1.2 but still in spec) */
export const AriaDragDropAttrs = [
	"aria-dropeffect",
	"aria-grabbed",
] as const;

/** Live region attributes */
export const AriaLiveRegionAttrs = [
	"aria-atomic",
	"aria-busy",
	"aria-live",
	"aria-relevant",
] as const;

/** Position/set attributes */
export const AriaPositionAttrs = [
	"aria-colcount",
	"aria-colindex",
	"aria-colspan",
	"aria-posinset",
	"aria-rowcount",
	"aria-rowindex",
	"aria-rowspan",
	"aria-setsize",
] as const;

/** All ARIA attributes combined */
export const AriaAttributes = [
	...AriaRelationshipAttrs,
	...AriaStateAttrs,
	...AriaPropertyAttrs,
	...AriaLiveRegionAttrs,
	...AriaPositionAttrs,
	...AriaDragDropAttrs,
] as const;

// Zod schema for ARIA attributes
export const AriaAttributeSchema = z.enum(AriaAttributes);
export type AriaAttribute = z.infer<typeof AriaAttributeSchema>;

// Specific schema for relationship attributes (used in SlotRelationship)
export const AriaRelationshipAttrSchema = z.enum(AriaRelationshipAttrs);
export type AriaRelationshipAttr = z.infer<typeof AriaRelationshipAttrSchema>;

// =============================================================================
// KEYBOARD — Standard KeyboardEvent.key values
// =============================================================================

export const KeyboardKeys = [
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

export const KeyboardKeySchema = z.enum(KeyboardKeys);
export type KeyboardKey = z.infer<typeof KeyboardKeySchema>;

/** Actions that keyboard input can trigger */
export const KeyboardActions = [
	"next-item",
	"prev-item",
	"first-item",
	"last-item",
	"activate",
	"toggle",
	"select",
	"open",
	"close",
	"exit", // Tab exits component
	"exit-to-trigger",
	"delete",
	"type-ahead",
	"page-next",
	"page-prev",
	"increment",
	"decrement",
] as const;

export const KeyboardActionSchema = z.enum(KeyboardActions);
export type KeyboardAction = z.infer<typeof KeyboardActionSchema>;

// =============================================================================
// ORIENTATION
// =============================================================================

export const Orientations = ["horizontal", "vertical", "both"] as const;
export const OrientationSchema = z.enum(Orientations);
export type Orientation = z.infer<typeof OrientationSchema>;

// =============================================================================
// FOCUS STRATEGY
// =============================================================================

export const FocusStrategies = ["trap", "roving", "activedescendant", "redirect", "none"] as const;

export const FocusStrategySchema = z.enum(FocusStrategies);
export type FocusStrategy = z.infer<typeof FocusStrategySchema>;

// =============================================================================
// STATE TOKENS — data-state attribute values
// =============================================================================

export const StateTokens = [
	// Presence
	"hidden",
	"visible",
	"inert",
	// Primary
	"open",
	"closed",
	"selected",
	"checked",
	"indeterminate",
	"disabled",
	"readonly",
	"required",
	"invalid",
	"valid",
	// Focus
	"focused",
	"focus-visible",
	"focus-within",
	// Interaction
	"hover",
	"active",
	"pressed",
	// Loading
	"loading",
	"pending",
	"busy",
	// Animation
	"entering",
	"exiting",
	// Position
	"expanded",
	"collapsed",
] as const;

export const StateTokenSchema = z.enum(StateTokens);
export type StateToken = z.infer<typeof StateTokenSchema>;

// =============================================================================
// SLOT ACTIONS
// =============================================================================

export const SlotActions = [
	"open",
	"close",
	"toggle",
	"select",
	"deselect",
	"focus",
	"blur",
	"expand",
	"collapse",
	"check",
	"uncheck",
	"enable",
	"disable",
	"increment",
	"decrement",
	"submit",
	"reset",
	"dismiss",
	"filter", // Combobox: filter options
	"clear", // Combobox: clear input/selection
] as const;

export const SlotActionSchema = z.enum(SlotActions);
export type SlotAction = z.infer<typeof SlotActionSchema>;

// =============================================================================
// HTML ELEMENTS
// =============================================================================

export const HtmlElements = [
	"div",
	"span",
	"section",
	"article",
	"aside",
	"nav",
	"header",
	"footer",
	"main",
	"button",
	"a",
	"input",
	"textarea",
	"select",
	"label",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"p",
	"hr",
	"ul",
	"ol",
	"li",
	"dl",
	"dt",
	"dd",
	"img",
	"figure",
	"figcaption",
	"table",
	"thead",
	"tbody",
	"tfoot",
	"tr",
	"th",
	"td",
	"form",
	"fieldset",
	"legend",
	"output",
	"progress",
	"meter",
	"details",
	"summary",
	"dialog",
	"fragment", // Virtual - no DOM element
] as const;

export const HtmlElementSchema = z.enum(HtmlElements);
export type HtmlElement = z.infer<typeof HtmlElementSchema>;

// =============================================================================
// SLOT CHILDREN MODE
// =============================================================================

export const SlotChildrenModes = [
	"snippet", // Accepts Snippet children
	"self-closing", // No children (input, img)
	"renderless", // No DOM, only children (context providers)
] as const;

export const SlotChildrenModeSchema = z.enum(SlotChildrenModes);
export type SlotChildrenMode = z.infer<typeof SlotChildrenModeSchema>;

// =============================================================================
// ARIA STATE PROVIDER
// =============================================================================

export const AriaStateProviders = ["meltui", "coldlight"] as const;
export const AriaStateProviderSchema = z.enum(AriaStateProviders);
export type AriaStateProvider = z.infer<typeof AriaStateProviderSchema>;
