/**
 * @file dsAdapter Base Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 * @layer api/dsadapters/_base
 *
 * SINGLE SOURCE OF TRUTH for the dsAdapter layer. Everything the adapter
 * system needs — types, Zod schemas, validation — lives here.
 *
 * This file consolidates what was previously scattered across:
 *   _schema/engine.ts      → AdapterResult, AdapterFactory, ComponentSchema
 *   _schema/adapter-schema.ts → AdapterSchemaZ, SlotContractSchema, etc.
 *   _schema/types.ts        → DELETED (superseded by AdapterSchemaZ)
 *
 * Three enforcement levels:
 *   Build-time:   Zod validates via AdapterSchemaZ.parse()
 *   Compile-time: TypeScript enforces via `satisfies AdapterSchema`
 *   Runtime:      JSON-serializable for VPB introspection
 *
 * The schema IS the contract. There is no separate contract file.
 */

import { z } from "zod";

// =============================================================================
// ENGINE TYPE — which adapter implementation backs this kind
// =============================================================================

export const EngineTypeSchema = z.enum(["meltui", "coldlight"]);
export type EngineType = z.infer<typeof EngineTypeSchema>;

// =============================================================================
// ADAPTER RESULT — the universal shape every adapter returns
// =============================================================================

/**
 * Universal adapter result. Every adapter — MeltUI or ColdLight-owned —
 * returns this exact shape. Components never see the implementation.
 *
 * - `states`: reactive boolean state per declared state token
 * - `attrs`: per-slot ARIA attribute records (role, aria-*, tabindex, etc.)
 * - `handlers`: per-slot event handler records (click, keydown, etc.)
 * - `context`: optional shared context for compound components
 */
export interface AdapterResult {
	/** Reactive state per declared state token (disabled, pressed, expanded, etc.) */
	readonly states: Record<string, { get current(): boolean; set current(v: boolean) }>;

	/** Per-slot ARIA attribute records — spread directly onto elements */
	readonly attrs: Record<string, Record<string, string | undefined>>;

	/** Per-slot event handler records — spread directly onto elements */
	readonly handlers: Record<string, Record<string, (e: Event) => void>>;

	/** Optional shared context for compound components (accordion items, tab panels) */
	readonly context?: Record<string, unknown>;
}

// =============================================================================
// ADAPTER FACTORY — what each adapter module exports
// =============================================================================

/**
 * Every adapter module exports a factory function matching this signature.
 * The factory receives component props and returns the universal AdapterResult.
 */
export type AdapterFactory<TProps = Record<string, unknown>> = (
	props?: TProps,
) => AdapterResult;

// =============================================================================
// COMPONENT SCHEMA (LEGACY) — flat shape used by resolve.ts + per-kind schema.ts
// =============================================================================

/**
 * ComponentSchema — the flat declaration used by resolveAdapter().
 * Per-kind schema.ts files export this to tell the resolver which engine to load.
 *
 * @deprecated Prefer AdapterSchema (Zod-validated, comprehensive).
 * This type is kept for migration compatibility — 150+ files reference it.
 * Will be removed once all per-kind schemas migrate to AdapterSchemaZ.
 */
export interface ComponentSchema {
	/** Primitive kind identifier */
	readonly kind: string;

	/** Which adapter engine backs this primitive */
	readonly engine: EngineType;

	/** Declared slot names */
	readonly slots: readonly string[];

	/** Declared state tokens */
	readonly states: readonly string[];

	/** Required ARIA attributes */
	readonly aria: readonly string[];

	/** Declared keyboard/pointer interactions */
	readonly interactions: readonly string[];
}

// =============================================================================
// FOCUS STRATEGY — How this component manages keyboard focus
// =============================================================================

export const FocusStrategySchema = z.enum([
	"none",                // No special focus management (e.g., badge, separator)
	"roving",              // Roving tabindex — DOM focus moves between focusable elements
	"activedescendant",    // aria-activedescendant — DOM focus stays on one element, virtual focus moves
	"trap",                // Focus trap — focus cannot leave the container (dialog, modal)
	"redirect",            // Redirect focus to another element (label → input)
]);
export type FocusStrategy = z.infer<typeof FocusStrategySchema>;

// =============================================================================
// ARIA REQUIREMENT LEVEL — Distinguishes MUST from MAY
// =============================================================================

export const AriaRequirementLevel = z.enum(["MUST", "SHOULD", "MAY"]);
export type AriaRequirementLevelType = z.infer<typeof AriaRequirementLevel>;

// =============================================================================
// SLOT ARIA ATTRIBUTE — One ARIA attribute on one slot
// =============================================================================

/** A single ARIA attribute requirement on a slot. */
export const SlotAriaAttrSchema = z.object({
	/** The ARIA attribute name (e.g., "aria-expanded", "aria-controls") */
	attr: z.string().min(1),
	/** Requirement level per WAI-ARIA spec */
	level: AriaRequirementLevel,
	/** Value type for validation (e.g., "boolean", "idref", "token") */
	valueType: z.enum(["boolean", "tristate", "idref", "idref-list", "string", "integer", "number", "token", "token-list"]),
	/** For idref/idref-list: which slot's element ID this points to */
	targetSlot: z.string().optional(),
	/** Description of what this attribute communicates */
	description: z.string().min(1),
});
export type SlotAriaAttr = z.infer<typeof SlotAriaAttrSchema>;

// =============================================================================
// SLOT CONTRACT — Per-slot declaration of structure + ARIA + state
// =============================================================================

/** Full contract for a single slot in the component. */
export const SlotContractSchema = z.object({
	/** Slot name (e.g., "input", "trigger", "content", "option") */
	name: z.string().min(1),

	/** HTML element this slot renders */
	element: z.string().min(1),

	/** WAI-ARIA role for this slot. null = no explicit role (inherits from element) */
	role: z.string().nullable(),

	/** ARIA attributes this slot provides — with requirement levels */
	aria: z.array(SlotAriaAttrSchema).readonly(),

	/** Valid data-state values for this slot */
	states: z.array(z.string().min(1)).readonly(),

	/** Whether this slot is per-item (compound components: option, item, trigger in accordion) */
	perItem: z.boolean(),

	/** Whether this slot is required or optional */
	required: z.boolean(),

	/** For MeltUI: which getter/method provides this slot's attributes */
	meltGetter: z.string().nullable(),

	/** Keyboard interactions handled BY this slot */
	keyboard: z.array(z.object({
		key: z.string().min(1),
		action: z.string().min(1),
		description: z.string().min(1),
		/** Whether the APG spec requires this key (MUST) or it's optional (MAY) */
		level: AriaRequirementLevel,
	})).readonly(),
});
export type SlotContract = z.infer<typeof SlotContractSchema>;

// =============================================================================
// PROP CONTRACT — Per-prop declaration
// =============================================================================

/** A single configurable prop on the component. */
export const PropContractSchema = z.object({
	/** ColdLight prop name (what the consumer passes) */
	name: z.string().min(1),
	/** TypeScript type as a string (for VPB introspection) */
	type: z.string().min(1),
	/** Whether this prop is required */
	required: z.boolean(),
	/** Default value (JSON-serializable for VPB) */
	defaultValue: z.unknown().optional(),
	/** For MeltUI: the corresponding MeltUI config property name. null if ColdLight-only. */
	meltProp: z.string().nullable(),
	/** Short description for VPB prop panel */
	description: z.string().min(1),
});
export type PropContract = z.infer<typeof PropContractSchema>;

// =============================================================================
// RELATIONSHIP — ARIA relationship between two slots
// =============================================================================

/** Declares an ARIA relationship between two slots. */
export const SlotRelationshipSchema = z.object({
	/** The slot that HAS the attribute */
	sourceSlot: z.string().min(1),
	/** The ARIA attribute (e.g., "aria-controls", "aria-labelledby") */
	attr: z.string().min(1),
	/** The slot whose ID is the TARGET of the attribute */
	targetSlot: z.string().min(1),
	/** Whether this relationship is required (MUST exist at render time) */
	required: z.boolean(),
});
export type SlotRelationship = z.infer<typeof SlotRelationshipSchema>;

// =============================================================================
// ADAPTER SCHEMA — THE UNIFIED TYPE (Zod-validated)
// =============================================================================

/** The complete adapter schema. Schema IS the contract. */
export const AdapterSchemaZ = z.object({
	// ─── Identity ────────────────────────────────────────────────────────
	/** Primitive kind identifier (e.g., "combobox", "dialog", "button") */
	kind: z.string().min(1),
	/** Which engine backs this adapter */
	engine: EngineTypeSchema,
	/** Human-readable description */
	description: z.string().min(1),

	// ─── WAI-ARIA APG Reference ──────────────────────────────────────────
	/** WAI-ARIA APG pattern URL. null if no APG pattern exists. */
	apgPattern: z.string().url().nullable(),
	/** ARIA spec version this schema targets */
	ariaVersion: z.enum(["1.2", "1.3"]).default("1.2"),

	// ─── Slots ───────────────────────────────────────────────────────────
	/** Per-slot contracts — the core of the schema */
	slots: z.record(z.string(), SlotContractSchema),

	// ─── Relationships ───────────────────────────────────────────────────
	/** ARIA relationships between slots (aria-controls, aria-labelledby, etc.) */
	relationships: z.array(SlotRelationshipSchema).readonly(),

	// ─── Focus ───────────────────────────────────────────────────────────
	/** Focus management strategy */
	focusStrategy: FocusStrategySchema,
	/** Which slot receives initial focus when the component opens/activates. null if N/A. */
	initialFocusSlot: z.string().nullable(),
	/** Which slot receives focus when the component closes. null if N/A. */
	returnFocusSlot: z.string().nullable(),

	// ─── Props ───────────────────────────────────────────────────────────
	/** All configurable props on this component */
	props: z.array(PropContractSchema).readonly(),

	// ─── Compound ────────────────────────────────────────────────────────
	/** Whether this is a compound component (has per-item slots) */
	compound: z.boolean(),

	// ─── MeltUI-Specific ─────────────────────────────────────────────────
	/** MeltUI builder class name. null if engine is "coldlight". */
	meltClass: z.string().nullable(),
	/** MeltUI import path. null if engine is "coldlight". */
	meltImport: z.string().nullable(),

	// ─── States ──────────────────────────────────────────────────────────
	/** All state tokens this component can be in */
	states: z.array(z.string().min(1)).readonly(),
	/** State → ARIA attribute mapping (e.g., expanded → aria-expanded) */
	stateAriaMapping: z.record(z.string(), z.string()).optional(),

	// ─── Interactions ────────────────────────────────────────────────────
	interactions: z.object({
		modal: z.boolean(),
		selectable: z.boolean(),
		editable: z.boolean(),
		expandable: z.boolean(),
	}),
});

export type AdapterSchema = z.infer<typeof AdapterSchemaZ>;

// =============================================================================
// VALIDATION
// =============================================================================

/** Parse and validate. Throws ZodError if invalid. */
export function parseAdapterSchema(data: unknown): AdapterSchema {
	return AdapterSchemaZ.parse(data);
}

/** Safe parse. */
export function safeParseAdapterSchema(data: unknown) {
	return AdapterSchemaZ.safeParse(data);
}

/**
 * Deep validation — cross-checks internal consistency.
 * - Relationship sourceSlot and targetSlot must exist in slots
 * - initialFocusSlot and returnFocusSlot must exist in slots (if non-null)
 * - perItem slots require compound=true
 * - MeltUI engine requires meltClass and meltImport
 * - ColdLight engine requires meltClass and meltImport to be null
 * - No duplicate prop names
 * - ARIA attribute targetSlot references must exist in slots
 */
export function validateAdapterSchema(schema: AdapterSchema): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	const slotNames = new Set(Object.keys(schema.slots));

	// Relationship references
	for (const rel of schema.relationships) {
		if (!slotNames.has(rel.sourceSlot)) {
			errors.push(`relationship.sourceSlot "${rel.sourceSlot}" not in slots`);
		}
		if (!slotNames.has(rel.targetSlot)) {
			errors.push(`relationship.targetSlot "${rel.targetSlot}" not in slots`);
		}
	}

	// Focus slot references
	if (schema.initialFocusSlot && !slotNames.has(schema.initialFocusSlot)) {
		errors.push(`initialFocusSlot "${schema.initialFocusSlot}" not in slots`);
	}
	if (schema.returnFocusSlot && !slotNames.has(schema.returnFocusSlot)) {
		errors.push(`returnFocusSlot "${schema.returnFocusSlot}" not in slots`);
	}

	// Per-item slots require compound
	for (const [name, slot] of Object.entries(schema.slots)) {
		if (slot.perItem && !schema.compound) {
			errors.push(`slot "${name}" is perItem but compound is false`);
		}
	}

	// MeltUI engine checks
	if (schema.engine === "meltui") {
		if (!schema.meltClass) {
			errors.push("engine is 'meltui' but meltClass is null");
		}
		if (!schema.meltImport) {
			errors.push("engine is 'meltui' but meltImport is null");
		}
	}

	// ColdLight engine checks
	if (schema.engine === "coldlight") {
		if (schema.meltClass) {
			errors.push("engine is 'coldlight' but meltClass is set");
		}
		if (schema.meltImport) {
			errors.push("engine is 'coldlight' but meltImport is set");
		}
	}

	// Prop uniqueness
	const propNames = new Set<string>();
	for (const prop of schema.props) {
		if (propNames.has(prop.name)) {
			errors.push(`duplicate prop name "${prop.name}"`);
		}
		propNames.add(prop.name);
	}

	// ARIA attribute targetSlot references
	for (const [slotName, slot] of Object.entries(schema.slots)) {
		for (const ariaAttr of slot.aria) {
			if (ariaAttr.targetSlot && !slotNames.has(ariaAttr.targetSlot)) {
				errors.push(`slot "${slotName}" aria attr "${ariaAttr.attr}" targets slot "${ariaAttr.targetSlot}" which doesn't exist`);
			}
		}
	}

	return { valid: errors.length === 0, errors };
}

// =============================================================================
// JSON EXPORT — For VPB consumption
// =============================================================================

/** Serialize to plain JSON for VPB. */
export function adapterSchemaToJSON(schema: AdapterSchema): Record<string, unknown> {
	return JSON.parse(JSON.stringify(schema));
}
