/**
 * @file Primitive Contract — Composite Schemas & Validation
 * @package @devpulse/coldlight
 *
 * REAL ENFORCEMENT via Zod runtime validation.
 * PrimitiveContractSchema is THE master shape ALL primitives must satisfy.
 * Scanner calls .parse() — invalid contracts FAIL HARD.
 *
 * Reference: W3C WAI-ARIA 1.2 (https://www.w3.org/WAI/ARIA/apg/)
 */

import { z } from "zod";
import {
	AriaAttributeSchema,
	AriaRelationshipAttrSchema,
	AriaRoleSchema,
	AriaStateProviderSchema,
	FocusStrategySchema,
	HtmlElementSchema,
	KeyboardActionSchema,
	KeyboardKeySchema,
	OrientationSchema,
	SlotActionSchema,
	SlotChildrenModeSchema,
	StateTokenSchema,
} from "./schema.js";

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
