/**
 * @file ColdLight Component Schema — ARIA Value Types & Slot Schemas
 * @package @devpulse/coldlight
 *
 * COMPONENT-LEVEL ARIA enforcement schemas.
 * Builds on primitive schemas to define per-slot ARIA value validation,
 * typed attribute maps, and component slot contracts.
 *
 * Reference: W3C WAI-ARIA 1.2 (https://www.w3.org/WAI/ARIA/apg/)
 */

import { z } from "zod";
import {
	AriaAttributeSchema,
	AriaRoleSchema,
	KeyboardKeySchema,
	StateTokenSchema,
} from "../primitives/schema.js";

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
