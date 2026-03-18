/**
 * @file Component Schema — ARIA Value Types & Slot Schemas
 * @package @devpulse/coldlight
 *
 * COMPONENT-LEVEL ARIA enforcement schemas.
 * Builds on primitive schemas to define per-slot ARIA value validation,
 * typed attribute maps, and component slot contracts.
 *
 * Reference: W3C WAI-ARIA 1.2 (https://www.w3.org/TR/wai-aria-1.2/)
 * Reference: W3C WAI-ARIA 1.3 Working Draft (https://w3c.github.io/aria/)
 * Reference: WAI-Adapt Content Module (https://w3c.github.io/adapt/)
 */

import { z } from "zod";
import {
	AriaAttributeSchema,
	AriaRoleSchema,
	KeyboardKeySchema,
	StateTokenSchema,
} from "../../primitives/_schema/schema.js";

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

	// =========================================================================
	// ARIA 1.3 — New attributes (Working Draft)
	// https://w3c.github.io/aria/
	// =========================================================================

	/** Supplementary description — richer than aria-label. ARIA 1.3 new. */
	"aria-description": z.string(),
	/** Braille-specific label for refreshable braille displays. ARIA 1.3 new. */
	"aria-braillelabel": z.string(),
	/** Braille-specific role description. ARIA 1.3 new. */
	"aria-brailleroledescription": z.string(),
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

// =============================================================================
// ARIA 1.3 — New roles (Working Draft)
// https://w3c.github.io/aria/
// =============================================================================

/** ARIA 1.3 new roles — suggestion, comment, mark */
export const Aria13RoleValues = ["suggestion", "comment", "mark"] as const;
export const Aria13RoleSchema = z.enum(Aria13RoleValues);
export type Aria13Role = z.infer<typeof Aria13RoleSchema>;

/** ARIA spec version this contract targets */
export const AriaVersionValues = ["1.2", "1.3"] as const;
export const AriaVersionSchema = z.enum(AriaVersionValues);
export type AriaVersion = z.infer<typeof AriaVersionSchema>;

// =============================================================================
// WAI-ADAPT — Machine-readable semantics for AI/AT
// https://w3c.github.io/adapt/
// =============================================================================

/**
 * WAI-Adapt action tokens — declares what an interactive control DOES.
 * AI agents use this to understand control purpose without parsing labels.
 *
 * Reference: WAI-Adapt Content Module § action
 */
export const WaiAdaptActionValues = [
	// Navigation
	"navigate",
	"navigate-back",
	"navigate-forward",
	"navigate-home",
	"navigate-up",
	"scroll-up",
	"scroll-down",
	// Actions
	"search",
	"submit",
	"confirm",
	"cancel",
	"close",
	"dismiss",
	"delete",
	"remove",
	"add",
	"edit",
	"save",
	"undo",
	"redo",
	"copy",
	"paste",
	"cut",
	"refresh",
	"reload",
	// Selection
	"select",
	"deselect",
	"select-all",
	"toggle",
	// Media
	"play",
	"pause",
	"stop",
	"mute",
	"unmute",
	// System
	"print",
	"download",
	"upload",
	"share",
	"settings",
	"help",
	"info",
	// Combobox-specific
	"filter",
	"clear",
	"open-listbox",
	"close-listbox",
] as const;
export const WaiAdaptActionSchema = z.enum(WaiAdaptActionValues);
export type WaiAdaptAction = z.infer<typeof WaiAdaptActionSchema>;

/**
 * WAI-Adapt purpose tokens — declares what an input IS FOR.
 * Maps to HTML autocomplete values + extensions.
 *
 * Reference: WAI-Adapt Content Module § purpose
 */
export const WaiAdaptPurposeValues = [
	// Identity
	"name",
	"given-name",
	"family-name",
	"nickname",
	"username",
	// Contact
	"email",
	"tel",
	"url",
	"street-address",
	"postal-code",
	"country",
	// Credentials
	"current-password",
	"new-password",
	"one-time-code",
	// Payment
	"cc-number",
	"cc-exp",
	"cc-csc",
	// Search
	"search-term",
	// Custom
	"organization",
	"job-title",
	"bday",
] as const;
export const WaiAdaptPurposeSchema = z.enum(WaiAdaptPurposeValues);
export type WaiAdaptPurpose = z.infer<typeof WaiAdaptPurposeSchema>;

/**
 * WAI-Adapt simplification levels — cognitive accessibility importance.
 * AI can use this to simplify/reduce UI for users who need fewer choices.
 *
 * Reference: WAI-Adapt Content Module § simplification
 */
export const WaiAdaptSimplificationValues = [
	"critical", // Must always be visible — essential function
	"medium", // Important but can be collapsed in simplified views
	"low", // Can be hidden in simplified views
] as const;
export const WaiAdaptSimplificationSchema = z.enum(WaiAdaptSimplificationValues);
export type WaiAdaptSimplification = z.infer<typeof WaiAdaptSimplificationSchema>;

/**
 * WAI-Adapt contract for a component.
 * Machine-readable semantics for AI agents and assistive technologies.
 */
export const WaiAdaptContractSchema = z.object({
	/** What this control DOES — e.g., "search", "submit", "filter" */
	action: WaiAdaptActionSchema.optional(),
	/** What this input IS FOR — e.g., "email", "search-term" */
	purpose: WaiAdaptPurposeSchema.optional(),
	/** Cognitive importance level for UI simplification */
	simplification: WaiAdaptSimplificationSchema,
	/** Per-slot adapt overrides — slots may have different actions */
	slotAdapt: z
		.record(
			z.string(),
			z.object({
				action: WaiAdaptActionSchema.optional(),
				purpose: WaiAdaptPurposeSchema.optional(),
			}),
		)
		.optional(),
});
export type WaiAdaptContract = z.infer<typeof WaiAdaptContractSchema>;

/**
 * Live region configuration for components with dynamic content.
 * Declares how assistive technologies should announce changes.
 */
export const LiveRegionContractSchema = z.object({
	/** Slot name that acts as the live region */
	slot: z.string(),
	/** Live region politeness level */
	politeness: AriaLiveSchema,
	/** What changes are relevant */
	relevant: z.array(AriaRelevantSchema).readonly().optional(),
	/** Whether the entire region should be re-announced */
	atomic: z.boolean().optional(),
	/** Human-readable description of what gets announced */
	announces: z.string(),
});
export type LiveRegionContract = z.infer<typeof LiveRegionContractSchema>;
