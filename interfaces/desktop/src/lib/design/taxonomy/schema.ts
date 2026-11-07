/**
 * @file ColdLight Taxonomy Schema
 * @package @devpulse/coldlight
 *
 * REAL ENFORCEMENT via Zod runtime validation.
 * Types are DERIVED from schemas, not hand-written.
 * Scanner calls .parse() — invalid contracts FAIL HARD.
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

// =============================================================================
// COMPOSITE SCHEMAS — Built from primitives
// =============================================================================

/**
 * Per-slot ARIA specification.
 * Declares what ARIA role and attributes a slot MUST/MAY have.
 */
export const SlotAriaSpecSchema = z.object({
	role: AriaRoleSchema.optional(),
	required: z.array(AriaAttributeSchema).readonly(),
	optional: z.array(AriaAttributeSchema).readonly(),
});
export type SlotAriaSpec = z.infer<typeof SlotAriaSpecSchema>;

/**
 * Per-slot structural specification.
 */
export const SlotSpecSchema = z.object({
	element: HtmlElementSchema,
	children: SlotChildrenModeSchema,
	aria: SlotAriaSpecSchema,
});
export type SlotSpec = z.infer<typeof SlotSpecSchema>;

/**
 * Relationship between slots via ARIA relationship attributes.
 * e.g., trigger aria-controls → content
 */
export const SlotRelationshipSchema = z.object({
	sourceSlot: z.string(),
	attribute: AriaRelationshipAttrSchema,
	targetSlot: z.string(),
	required: z.boolean(),
});
export type SlotRelationship = z.infer<typeof SlotRelationshipSchema>;

/**
 * Context-aware keyboard mapping.
 * Keys do different things based on orientation and focus location.
 */
export const KeyboardContextSchema = z.object({
	orientation: OrientationSchema,
	focusLocation: z.string(), // Slot name
	key: KeyboardKeySchema,
	action: KeyboardActionSchema,
	required: z.boolean(),
});
export type KeyboardContext = z.infer<typeof KeyboardContextSchema>;

/**
 * Selection model for selectable primitives.
 */
export const SelectionModelSchema = z.object({
	type: z.enum(["single", "multiple"]),
	selectionFollowsFocus: z.boolean(),
	multiSelectModel: z.enum(["recommended", "alternative"]).optional(),
});
export type SelectionModel = z.infer<typeof SelectionModelSchema>;

/**
 * Focus management specification.
 */
export const FocusSpecSchema = z.object({
	strategy: FocusStrategySchema,
	onOpen: z.string().optional(), // Slot name or "first-focusable"
	onEscape: z.enum(["return-to-trigger", "close-only"]).or(z.string()).optional(),
	tabBehavior: z.enum(["cycle-within", "exit-on-boundary"]).optional(),
	wrapAround: z.boolean().optional(),
});
export type FocusSpec = z.infer<typeof FocusSpecSchema>;

/**
 * Dismiss behavior for overlay primitives.
 */
export const DismissBehaviorSchema = z.object({
	escape: z.boolean(),
	outsideClick: z.boolean(),
});
export type DismissBehavior = z.infer<typeof DismissBehaviorSchema>;

/**
 * Filtering behavior for combobox/autocomplete.
 */
export const FilteringSpecSchema = z.object({
	enabled: z.boolean(),
	mode: z.enum(["contains", "startsWith", "exact", "custom"]),
	typeahead: z.boolean().optional(),
});
export type FilteringSpec = z.infer<typeof FilteringSpecSchema>;

/**
 * Expansion model for accordion/collapsible.
 */
export const ExpansionModelSchema = z.object({
	mode: z.enum(["single", "multiple"]),
	collapseOthers: z.boolean().optional(),
});
export type ExpansionModel = z.infer<typeof ExpansionModelSchema>;

/**
 * Primitive-level ARIA requirements.
 */
export const AriaRequirementsSchema = z.object({
	role: AriaRoleSchema,
	requiredAttrs: z.array(AriaAttributeSchema).readonly(),
	optionalAttrs: z.array(AriaAttributeSchema).readonly(),
});
export type AriaRequirements = z.infer<typeof AriaRequirementsSchema>;

// =============================================================================
// PRIMITIVE CONTRACT SCHEMA — THE MAIN ENFORCEMENT
// =============================================================================

/**
 * The full primitive contract schema.
 * Scanner calls .parse() on every contract — invalid = build fails.
 */
export const PrimitiveContractSchema = z.object({
	kind: z.string().min(1),
	ariaStateProvider: AriaStateProviderSchema,

	// Structure
	slots: z.object({
		required: z.array(z.string()).readonly(),
		optional: z.array(z.string()).readonly(),
		forbidden: z.array(z.string()).readonly(),
	}),
	slotSpec: z.record(z.string(), SlotSpecSchema),

	// Relationships (NEW)
	slotRelationships: z.array(SlotRelationshipSchema).readonly().optional(),

	// State
	states: z.object({
		shared: z.array(StateTokenSchema).readonly(),
		specific: z.array(StateTokenSchema).readonly(),
	}),
	slotStates: z.record(z.string(), z.array(StateTokenSchema).readonly()),
	slotActions: z.record(z.string(), z.array(SlotActionSchema).readonly()),

	// ARIA
	aria: AriaRequirementsSchema,

	// Keyboard (enhanced)
	keyboard: z.array(KeyboardKeySchema).readonly(), // Legacy flat array
	keyboardMap: z.array(KeyboardContextSchema).readonly().optional(), // NEW context-aware

	// Focus (enhanced)
	focusStrategy: FocusStrategySchema, // Legacy
	focus: FocusSpecSchema.optional(), // NEW detailed spec

	// Selection (NEW)
	selection: SelectionModelSchema.optional(),

	// Filtering (combobox-specific)
	filtering: FilteringSpecSchema.optional(),

	// Expansion (accordion-specific)
	expansion: ExpansionModelSchema.optional(),

	// Behavior
	compound: z.boolean(),
	orientation: OrientationSchema.optional(),
	dismissBehavior: DismissBehaviorSchema.optional(),
});

export type PrimitiveContract = z.infer<typeof PrimitiveContractSchema>;

// =============================================================================
// VALIDATION FUNCTIONS — Used by scanner
// =============================================================================

/**
 * Validate a contract. Throws ZodError if invalid.
 * Use in scanner: parseContract(imported.contract)
 */
export function parseContract(data: unknown): PrimitiveContract {
	return PrimitiveContractSchema.parse(data);
}

/**
 * Safe validation that returns result object instead of throwing.
 */
export function safeParseContract(data: unknown) {
	return PrimitiveContractSchema.safeParse(data);
}

/**
 * Validate that slotRelationships reference valid slots.
 * Call after parseContract for deep validation.
 */
export function validateSlotRelationships(contract: PrimitiveContract): string[] {
	const errors: string[] = [];
	const allSlots = new Set([...contract.slots.required, ...contract.slots.optional]);

	for (const rel of contract.slotRelationships ?? []) {
		if (!allSlots.has(rel.sourceSlot)) {
			errors.push(`slotRelationship references unknown sourceSlot: ${rel.sourceSlot}`);
		}
		if (!allSlots.has(rel.targetSlot)) {
			errors.push(`slotRelationship references unknown targetSlot: ${rel.targetSlot}`);
		}
	}

	return errors;
}

/**
 * Validate that keyboardMap focusLocation references valid slots.
 */
export function validateKeyboardMap(contract: PrimitiveContract): string[] {
	const errors: string[] = [];
	const allSlots = new Set([...contract.slots.required, ...contract.slots.optional]);

	for (const ctx of contract.keyboardMap ?? []) {
		if (!allSlots.has(ctx.focusLocation)) {
			errors.push(`keyboardMap references unknown focusLocation: ${ctx.focusLocation}`);
		}
	}

	return errors;
}

/**
 * Full contract validation — schema + deep checks.
 * Returns all errors or empty array if valid.
 */
export function validateContract(data: unknown): { valid: boolean; errors: string[] } {
	const result = safeParseContract(data);

	if (!result.success) {
		return {
			valid: false,
			errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
		};
	}

	const contract = result.data;
	const deepErrors = [...validateSlotRelationships(contract), ...validateKeyboardMap(contract)];

	return {
		valid: deepErrors.length === 0,
		errors: deepErrors,
	};
}
