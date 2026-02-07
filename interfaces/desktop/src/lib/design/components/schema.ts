/**
 * @file Component Schema Layer
 * @package @devpulse/coldlight
 *
 * COMPONENT-LEVEL ARIA ENFORCEMENT
 * Builds on taxonomy contracts to enforce full ARIA at render time.
 * AI agents can introspect these schemas to understand component semantics.
 *
 * Layers:
 * 1. PrimitiveContract (taxonomy/schema.ts) - SSOT for ARIA specs
 * 2. ComponentContract (this file) - Render-time enforcement + AI introspection
 * 3. Transport (adapters) - Actual ARIA attribute providers
 *
 * Reference: W3C WAI-ARIA 1.2 (https://www.w3.org/WAI/ARIA/apg/)
 */

import { z } from "zod";
import {
	AriaAttributeSchema,
	AriaRoleSchema,
	FocusStrategySchema,
	KeyboardKeySchema,
	type PrimitiveContract,
	StateTokenSchema,
} from "$lib/design/taxonomy/schema.js";

// =============================================================================
// ARIA VALUE TYPES — Specific value schemas for ARIA attributes
// =============================================================================

/** aria-haspopup values (WAI-ARIA 1.2) */
export const AriaHasPopupValues = [
	"false",
	"true",
	"menu",
	"listbox",
	"tree",
	"grid",
	"dialog",
] as const;
export const AriaHasPopupSchema = z.enum(AriaHasPopupValues);
export type AriaHasPopupValue = z.infer<typeof AriaHasPopupSchema>;

/** aria-autocomplete values */
export const AriaAutoCompleteValues = ["none", "inline", "list", "both"] as const;
export const AriaAutoCompleteSchema = z.enum(AriaAutoCompleteValues);
export type AriaAutoCompleteValue = z.infer<typeof AriaAutoCompleteSchema>;

/** aria-orientation values */
export const AriaOrientationValues = ["horizontal", "vertical"] as const;
export const AriaOrientationSchema = z.enum(AriaOrientationValues);
export type AriaOrientationValue = z.infer<typeof AriaOrientationSchema>;

/** aria-sort values */
export const AriaSortValues = ["none", "ascending", "descending", "other"] as const;
export const AriaSortSchema = z.enum(AriaSortValues);
export type AriaSortValue = z.infer<typeof AriaSortSchema>;

/** aria-current values */
export const AriaCurrentValues = [
	"false",
	"true",
	"page",
	"step",
	"location",
	"date",
	"time",
] as const;
export const AriaCurrentSchema = z.enum(AriaCurrentValues);
export type AriaCurrentValue = z.infer<typeof AriaCurrentSchema>;

/** aria-live values */
export const AriaLiveValues = ["off", "polite", "assertive"] as const;
export const AriaLiveSchema = z.enum(AriaLiveValues);
export type AriaLiveValue = z.infer<typeof AriaLiveSchema>;

/** aria-relevant values (can be space-separated list) */
export const AriaRelevantValues = ["additions", "removals", "text", "all"] as const;
export const AriaRelevantSchema = z.enum(AriaRelevantValues);
export type AriaRelevantValue = z.infer<typeof AriaRelevantSchema>;

// =============================================================================
// TYPED ARIA ATTRIBUTE MAP — Full ARIA attribute value types
// =============================================================================

/**
 * Typed ARIA attribute values based on WAI-ARIA 1.2 spec.
 * Used for runtime validation that ARIA values are correct.
 */
export const AriaAttrValueSchemas = {
	// Relationship (ID references)
	"aria-activedescendant": z.string(), // IDREF
	"aria-controls": z.string(), // IDREF_LIST
	"aria-describedby": z.string(), // IDREF_LIST
	"aria-details": z.string(), // IDREF_LIST
	"aria-flowto": z.string(), // IDREF_LIST
	"aria-labelledby": z.string(), // IDREF_LIST
	"aria-owns": z.string(), // IDREF_LIST

	// State (boolean/tristate)
	"aria-checked": z.enum(["false", "true", "mixed"]),
	"aria-disabled": z.enum(["false", "true"]),
	"aria-expanded": z.enum(["false", "true"]),
	"aria-hidden": z.enum(["false", "true"]),
	"aria-invalid": z.enum(["false", "true", "grammar", "spelling"]),
	"aria-pressed": z.enum(["false", "true", "mixed"]),
	"aria-selected": z.enum(["false", "true"]),

	// Property (various)
	"aria-autocomplete": AriaAutoCompleteSchema,
	"aria-errormessage": z.string(), // IDREF
	"aria-haspopup": AriaHasPopupSchema,
	"aria-label": z.string(),
	"aria-level": z.number().int().min(1),
	"aria-modal": z.enum(["false", "true"]),
	"aria-multiline": z.enum(["false", "true"]),
	"aria-multiselectable": z.enum(["false", "true"]),
	"aria-orientation": AriaOrientationSchema,
	"aria-placeholder": z.string(),
	"aria-readonly": z.enum(["false", "true"]),
	"aria-required": z.enum(["false", "true"]),
	"aria-sort": AriaSortSchema,
	"aria-valuemax": z.number(),
	"aria-valuemin": z.number(),
	"aria-valuenow": z.number(),
	"aria-valuetext": z.string(),
	"aria-roledescription": z.string(),

	// Live region
	"aria-atomic": z.enum(["false", "true"]),
	"aria-busy": z.enum(["false", "true"]),
	"aria-live": AriaLiveSchema,
	"aria-relevant": z.string(), // Space-separated AriaRelevantValues

	// Position/set
	"aria-colcount": z.number().int(),
	"aria-colindex": z.number().int().min(1),
	"aria-colspan": z.number().int().min(1),
	"aria-posinset": z.number().int().min(1),
	"aria-rowcount": z.number().int(),
	"aria-rowindex": z.number().int().min(1),
	"aria-rowspan": z.number().int().min(1),
	"aria-setsize": z.number().int(),
} as const;

// =============================================================================
// COMPONENT SLOT ARIA CONTRACT — Per-slot ARIA enforcement
// =============================================================================

/**
 * Per-slot ARIA attribute spec with value types.
 * More specific than primitive contract — includes value validation.
 */
export const ComponentSlotAriaSchema = z.object({
	/** ARIA role for this slot (if any) */
	role: AriaRoleSchema.optional(),

	/** Required ARIA attributes — MUST be present at render */
	required: z
		.array(
			z.object({
				attr: AriaAttributeSchema,
				valueType: z.string(), // Key into AriaAttrValueSchemas
			}),
		)
		.readonly(),

	/** Optional ARIA attributes — MAY be present */
	optional: z
		.array(
			z.object({
				attr: AriaAttributeSchema,
				valueType: z.string(),
			}),
		)
		.readonly(),

	/** Relationship targets — IDs that must resolve to existing elements */
	relationships: z
		.array(
			z.object({
				attr: AriaAttributeSchema,
				targetSlot: z.string(), // Slot name whose ID is the target
				required: z.boolean(),
			}),
		)
		.readonly()
		.optional(),
});
export type ComponentSlotAria = z.infer<typeof ComponentSlotAriaSchema>;

/**
 * Per-slot data attributes for state and AI introspection.
 */
export const ComponentSlotDataSchema = z.object({
	/** data-kind — component kind identifier */
	kind: z.string(),
	/** data-slot — slot name */
	slot: z.string(),
	/** data-state values this slot can have */
	states: z.array(StateTokenSchema).readonly(),
});
export type ComponentSlotData = z.infer<typeof ComponentSlotDataSchema>;

/**
 * Full component slot contract.
 * Defines what a sub-component MUST render for ARIA compliance.
 */
export const ComponentSlotContractSchema = z.object({
	/** Slot name (e.g., "trigger", "content") */
	name: z.string(),
	/** HTML element this slot renders */
	element: z.string(),
	/** ARIA requirements */
	aria: ComponentSlotAriaSchema,
	/** Data attributes for state/AI */
	data: ComponentSlotDataSchema,
	/** Keyboard interactions this slot handles */
	keyboard: z
		.array(
			z.object({
				key: KeyboardKeySchema,
				action: z.string(),
				description: z.string(),
			}),
		)
		.readonly()
		.optional(),
});
export type ComponentSlotContract = z.infer<typeof ComponentSlotContractSchema>;

// =============================================================================
// COMPONENT CONTRACT — Full component ARIA contract
// =============================================================================

/**
 * Accessible name sources per WAI-ARIA.
 * Components MUST have an accessible name via one of these.
 */
export const AccessibleNameSourceSchema = z.enum([
	"aria-label", // Explicit label string
	"aria-labelledby", // Reference to labelling element
	"content", // Text content of element
	"title", // Title attribute (fallback)
]);
export type AccessibleNameSource = z.infer<typeof AccessibleNameSourceSchema>;

/**
 * Full component contract.
 * Declares complete ARIA semantics for AI introspection and validation.
 */
export const ComponentContractSchema = z.object({
	/** Component kind (e.g., "dialog", "combobox") */
	kind: z.string(),

	/** Human-readable description for AI agents */
	description: z.string(),

	/** W3C WAI-ARIA APG pattern reference URL */
	apgPattern: z.string().url().optional(),

	/** Slots this component provides */
	slots: z.object({
		required: z.array(z.string()).readonly(),
		optional: z.array(z.string()).readonly(),
	}),

	/** Per-slot contracts */
	slotContracts: z.record(z.string(), ComponentSlotContractSchema),

	/** Root accessible name requirement */
	accessibleName: z.object({
		required: z.boolean(),
		sources: z.array(AccessibleNameSourceSchema).readonly(),
		defaultSlot: z.string().optional(), // Slot that provides default label
	}),

	/** Focus management */
	focus: z.object({
		strategy: FocusStrategySchema,
		initialFocus: z.string().optional(), // Slot name
		returnFocus: z.string().optional(), // Slot name to return to on close
		trapContainer: z.string().optional(), // Slot name of focus trap
	}),

	/** Keyboard navigation model */
	keyboard: z.object({
		/** Global keys handled at component level */
		global: z
			.array(
				z.object({
					key: KeyboardKeySchema,
					action: z.string(),
					description: z.string(),
				}),
			)
			.readonly(),
		/** Slot-specific keys are in slotContracts */
	}),

	/** State semantics for AI */
	states: z.object({
		/** Primary state token (e.g., "open" for dialog) */
		primary: StateTokenSchema.optional(),
		/** All state tokens this component uses */
		all: z.array(StateTokenSchema).readonly(),
		/** State → ARIA attribute mappings */
		ariaMapping: z.record(z.string(), z.string()).optional(),
	}),

	/** Interaction semantics for AI */
	interactions: z.object({
		/** Can be opened/closed */
		modal: z.boolean(),
		/** User can select values */
		selectable: z.boolean(),
		/** User can input text */
		editable: z.boolean(),
		/** Component can be expanded/collapsed */
		expandable: z.boolean(),
	}),

	/** Linked primitive contract kind (for validation) */
	primitiveKind: z.string(),
});
export type ComponentContract = z.infer<typeof ComponentContractSchema>;

// =============================================================================
// VALIDATION FUNCTIONS — Component-level ARIA enforcement
// =============================================================================

/**
 * Validate that a component contract is consistent with its primitive contract.
 */
export function validateComponentContract(
	component: ComponentContract,
	primitive: PrimitiveContract,
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// 1. Kind must match
	if (component.primitiveKind !== primitive.kind) {
		errors.push(
			`Component references primitive '${component.primitiveKind}' but got '${primitive.kind}'`,
		);
	}

	// 2. Required slots must exist in primitive
	const primitiveSlots = new Set([...primitive.slots.required, ...primitive.slots.optional]);
	for (const slot of component.slots.required) {
		if (!primitiveSlots.has(slot)) {
			errors.push(`Component requires slot '${slot}' not defined in primitive`);
		}
	}

	// 3. Slot ARIA must match primitive slotSpec
	for (const [slotName, slotContract] of Object.entries(component.slotContracts)) {
		const primitiveSlot = primitive.slotSpec[slotName];
		if (!primitiveSlot) {
			errors.push(`Slot '${slotName}' not found in primitive slotSpec`);
			continue;
		}

		// Role must match
		if (slotContract.aria.role !== primitiveSlot.aria.role) {
			errors.push(
				`Slot '${slotName}' role mismatch: component='${slotContract.aria.role}' primitive='${primitiveSlot.aria.role}'`,
			);
		}

		// Required ARIA must include primitive required
		const componentRequired = new Set(slotContract.aria.required.map((r) => r.attr));
		for (const attr of primitiveSlot.aria.required) {
			if (!componentRequired.has(attr)) {
				errors.push(`Slot '${slotName}' missing required ARIA attribute '${attr}' from primitive`);
			}
		}
	}

	// 4. Focus strategy must match
	if (component.focus.strategy !== primitive.focusStrategy) {
		errors.push(
			`Focus strategy mismatch: component='${component.focus.strategy}' primitive='${primitive.focusStrategy}'`,
		);
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Validate slot attributes at runtime.
 * Call this with the actual attributes from transport.slots[slotName].
 */
export function validateSlotAttrs(
	slotContract: ComponentSlotContract,
	attrs: Record<string, unknown>,
): { valid: boolean; errors: string[]; warnings: string[] } {
	const errors: string[] = [];
	const warnings: string[] = [];

	// 1. Check required ARIA attributes
	for (const { attr } of slotContract.aria.required) {
		if (!(attr in attrs)) {
			errors.push(`Missing required ARIA attribute: ${attr}`);
		} else {
			// Validate value type
			const schema = AriaAttrValueSchemas[attr as keyof typeof AriaAttrValueSchemas];
			if (schema) {
				const result = schema.safeParse(attrs[attr]);
				if (!result.success) {
					errors.push(`Invalid value for ${attr}: ${result.error.message}`);
				}
			}
		}
	}

	// 2. Check role
	if (slotContract.aria.role && attrs.role !== slotContract.aria.role) {
		errors.push(`Role mismatch: expected '${slotContract.aria.role}' got '${attrs.role}'`);
	}

	// 3. Check relationship targets (warnings only — can't validate IDs exist at schema level)
	for (const rel of slotContract.aria.relationships ?? []) {
		if (rel.required && !(rel.attr in attrs)) {
			errors.push(`Missing required relationship attribute: ${rel.attr}`);
		}
		if (rel.attr in attrs && !attrs[rel.attr]) {
			warnings.push(`Relationship attribute ${rel.attr} is empty — target ID not set`);
		}
	}

	// Note: data attributes (data-kind, data-slot) are set in template, not transport

	return { valid: errors.length === 0, errors, warnings };
}

/**
 * Build a ComponentSlotContract from a PrimitiveContract slot.
 * Convenience function to derive component schema from primitive.
 */
export function deriveSlotContract(
	primitive: PrimitiveContract,
	slotName: string,
): ComponentSlotContract | null {
	const slotSpec = primitive.slotSpec[slotName];
	if (!slotSpec) return null;

	const slotStates = primitive.slotStates[slotName] ?? [];

	return {
		name: slotName,
		element: slotSpec.element,
		aria: {
			role: slotSpec.aria.role,
			required: slotSpec.aria.required.map((attr) => ({
				attr,
				valueType: attr, // Same as attr name for now
			})),
			optional: slotSpec.aria.optional.map((attr) => ({
				attr,
				valueType: attr,
			})),
			relationships: (primitive.slotRelationships ?? [])
				.filter((r) => r.sourceSlot === slotName)
				.map((r) => ({
					attr: r.attribute,
					targetSlot: r.targetSlot,
					required: r.required,
				})),
		},
		data: {
			kind: primitive.kind,
			slot: slotName,
			states: slotStates,
		},
		keyboard: (primitive.keyboardMap ?? [])
			.filter((k) => k.focusLocation === slotName)
			.map((k) => ({
				key: k.key,
				action: k.action,
				description: `${k.key} → ${k.action}`,
			})),
	};
}

/**
 * Parse and validate a component contract.
 */
export function parseComponentContract(data: unknown): ComponentContract {
	return ComponentContractSchema.parse(data);
}

/**
 * Safe parse a component contract.
 */
export function safeParseComponentContract(data: unknown) {
	return ComponentContractSchema.safeParse(data);
}
