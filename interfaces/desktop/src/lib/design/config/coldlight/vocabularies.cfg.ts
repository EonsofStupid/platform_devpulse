/**
 * @file ColdLight Vocabularies
 * @package @devpulse/coldlight
 *
 * SINGLE SOURCE OF TRUTH for all typed vocabularies in the design system.
 * Every type union in taxonomy/types.ts is DERIVED from these const arrays.
 *
 * Pattern: Data here → typeof X[number] in types.ts → zero duplication.
 * Powers: CSS generation, manifest output, dev tool validation, DTCG tokens.
 */

// =============================================================================
// ARIA ROLES — WAI-ARIA 1.2 specification
// =============================================================================

export const ARIA_ROLES = [
	// Widget roles
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
	// Document structure roles
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
	// Presentation
	"none",
	"presentation",
] as const;

// =============================================================================
// ARIA ATTRIBUTES — WAI-ARIA 1.2 specification
// =============================================================================

export const ARIA_ATTRIBUTES = [
	// Relationship
	"aria-activedescendant",
	"aria-controls",
	"aria-describedby",
	"aria-details",
	"aria-flowto",
	"aria-labelledby",
	"aria-owns",
	// Widget
	"aria-autocomplete",
	"aria-checked",
	"aria-disabled",
	"aria-errormessage",
	"aria-expanded",
	"aria-haspopup",
	"aria-hidden",
	"aria-invalid",
	"aria-label",
	"aria-level",
	"aria-modal",
	"aria-multiline",
	"aria-multiselectable",
	"aria-orientation",
	"aria-placeholder",
	"aria-pressed",
	"aria-readonly",
	"aria-required",
	"aria-selected",
	"aria-sort",
	"aria-valuemax",
	"aria-valuemin",
	"aria-valuenow",
	"aria-valuetext",
	// Live region
	"aria-atomic",
	"aria-busy",
	"aria-live",
	"aria-relevant",
	// Drag and drop
	"aria-dropeffect",
	"aria-grabbed",
	// Grid
	"aria-colcount",
	"aria-colindex",
	"aria-colspan",
	"aria-rowcount",
	"aria-rowindex",
	"aria-rowspan",
	// Misc
	"aria-current",
	"aria-keyshortcuts",
	"aria-posinset",
	"aria-roledescription",
	"aria-setsize",
] as const;

// =============================================================================
// KEYBOARD KEYS — Standard KeyboardEvent.key values
// =============================================================================

export const KEYBOARD_KEYS = [
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

// =============================================================================
// STATE TOKENS — data-state attribute values for CSS targeting
// =============================================================================

export const STATE_TOKENS = [
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

// =============================================================================
// SLOT ACTIONS — Behaviors a slot can trigger
// =============================================================================

export const SLOT_ACTIONS = [
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
] as const;

// =============================================================================
// ARIA STATE PROVIDERS — Who provides ARIA + state behavior per contract
// =============================================================================

export const ARIA_STATE_PROVIDERS = ["meltui", "coldlight"] as const;

// =============================================================================
// SCAN ERROR CODES — Scanner error taxonomy
// =============================================================================

export const SCAN_ERROR_CODES = [
	"PARITY_MISSING_FOLDER",
	"CONTRACT_LOAD_FAILED",
	"CONTRACT_INVALID",
	"SPINE_MISMATCH",
] as const;
