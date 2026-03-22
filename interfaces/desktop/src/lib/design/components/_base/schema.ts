/**
 * @file Component Schema — ONE Registration, Many Outputs
 * @package @devpulse/coldlight
 *
 * SINGLE source of truth for what a ColdLight component IS.
 * One registration per kind. Everything else is generated from it.
 *
 * 11-AXIS VISUAL SYSTEM (ADR-001 LOCKED):
 *   Every axis = 1 real DTCG $type. No invented types. No gaps.
 *   Components ONLY consume DTCG composite style tokens (recipes).
 *
 *   → TypeScript types (compile-time)
 *   → JSON manifest (VPB editor introspection)
 *   → Prop panel config (what the editor shows)
 *   → Token mapping (what visual axes apply per slot)
 *   → Slot structure (what children go where, what element, what role)
 *   → State machine (what states exist, what data-state values)
 *
 * The ARIA/behavior contract lives in primitive hooks (useButton, etc.).
 * This schema references it via `engine` but does NOT duplicate it.
 *
 * Build-time:  ComponentSchemaZ.parse() — Zod validates
 * Compile-time: satisfies ComponentSchema — TypeScript enforces
 * Runtime:     JSON.stringify() — VPB consumes
 */

import { z } from "zod";

// =============================================================================
// PROP TYPE — Discriminated union for VPB editor controls
// =============================================================================

const PropBase = z.object({
	label: z.string().min(1),
	description: z.string().optional(),
	required: z.boolean().default(false),
	advanced: z.boolean().default(false),
	hiddenWhen: z.string().optional(),
	group: z.string().optional(),
});

const StringPropSchema = PropBase.extend({
	type: z.literal("string"),
	defaultValue: z.string().optional(),
	placeholder: z.string().optional(),
	multiline: z.boolean().default(false),
});

const NumberPropSchema = PropBase.extend({
	type: z.literal("number"),
	defaultValue: z.number().optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	step: z.number().optional(),
	unit: z.string().optional(),
});

const BooleanPropSchema = PropBase.extend({
	type: z.literal("boolean"),
	defaultValue: z.boolean().optional(),
});

const EnumPropSchema = PropBase.extend({
	type: z.literal("enum"),
	defaultValue: z.string().optional(),
	options: z
		.array(z.object({ value: z.string(), label: z.string() }))
		.min(1),
	segmented: z.boolean().default(false),
});

const ColorPropSchema = PropBase.extend({
	type: z.literal("color"),
	defaultValue: z.string().optional(),
	tokenOnly: z.boolean().default(true),
});

const SlotPropSchema = PropBase.extend({
	type: z.literal("slot"),
	allowedKinds: z.array(z.string()).optional(),
	repeated: z.boolean().default(false),
});

const EventPropSchema = PropBase.extend({
	type: z.literal("event"),
	signature: z.string().min(1),
});

const ObjectPropSchema = PropBase.extend({
	type: z.literal("object"),
	shape: z.string().min(1),
});

const ArrayPropSchema = PropBase.extend({
	type: z.literal("array"),
	itemType: z.string().min(1),
	defaultValue: z.array(z.unknown()).optional(),
});

export const ComponentPropSchema = z.discriminatedUnion("type", [
	StringPropSchema,
	NumberPropSchema,
	BooleanPropSchema,
	EnumPropSchema,
	ColorPropSchema,
	SlotPropSchema,
	EventPropSchema,
	ObjectPropSchema,
	ArrayPropSchema,
]);

export type ComponentProp = z.infer<typeof ComponentPropSchema>;

// =============================================================================
// 11-AXIS SLOT TOKEN MAPPING (ADR-001 LOCKED — DTCG-aligned)
// =============================================================================

/**
 * Declares which of the 11 visual axes a slot receives from StyleMacro.
 * Each axis = 1 real DTCG $type. Root slots typically get all axes.
 * Child slots inherit or get none.
 *
 * This drives: VPB token controls, StyleMacro resolution, glue CSS application.
 */
export const SlotTokenAxesSchema = z.object({
	/** background-color. DTCG: color */
	backgroundColor: z.boolean().default(false),
	/** backdrop-filter: blur(). DTCG: dimension */
	backgroundBlur: z.boolean().default(false),
	/** box-shadow (depth+bevel+glow). DTCG: shadow */
	shadow: z.boolean().default(false),
	/** border (color+width+style). DTCG: border */
	border: z.boolean().default(false),
	/** animation. DTCG: duration */
	animation: z.boolean().default(false),
	/** transition (duration+delay+easing). DTCG: transition */
	transition: z.boolean().default(false),
	/** font-family/size/weight/spacing/height. DTCG: typography */
	typography: z.boolean().default(false),
	/** background-image gradient. DTCG: gradient */
	gradient: z.boolean().default(false),
	/** foreground/text/icon color. DTCG: color */
	color: z.boolean().default(false),
	/** border-radius. DTCG: dimension */
	borderRadius: z.boolean().default(false),
	/** opacity. DTCG: number */
	opacity: z.boolean().default(false),
});

export type SlotTokenAxes = z.infer<typeof SlotTokenAxesSchema>;

/** All 11 axes enabled — for root slots. */
export const ALL_AXES: SlotTokenAxes = {
	backgroundColor: true,
	backgroundBlur: true,
	shadow: true,
	border: true,
	animation: true,
	transition: true,
	typography: true,
	gradient: true,
	color: true,
	borderRadius: true,
	opacity: true,
};

/** No axes — for child/structural slots that inherit from parent. */
export const NO_AXES: SlotTokenAxes = {
	backgroundColor: false,
	backgroundBlur: false,
	shadow: false,
	border: false,
	animation: false,
	transition: false,
	typography: false,
	gradient: false,
	color: false,
	borderRadius: false,
	opacity: false,
};

// =============================================================================
// COMPONENT SLOT — Structure + visual declaration per slot
// =============================================================================

export const ComponentSlotSchema = z.object({
	name: z.string().min(1),
	element: z.string().min(1),
	required: z.boolean(),
	perItem: z.boolean().default(false),
	tokenAxes: SlotTokenAxesSchema,
	structural: z.string().default(""),
	states: z.array(z.string().min(1)).readonly(),
});

export type ComponentSlot = z.infer<typeof ComponentSlotSchema>;

// =============================================================================
// STYLE BINDING — Links component to DTCG composite style tokens (recipes)
// =============================================================================

/**
 * Declares how this component connects to DTCG style token groups.
 * Style IDs reference token groups in JSON: style.{id}.{axis}
 * SD5 processes them. StyleMacro resolves them.
 *
 * NO JavaScript recipes. NO registerRecipe(). ONLY DTCG token group references.
 */
export const StyleBindingSchema = z.object({
	/** Default style ID (e.g., "button-primary") — references DTCG token group style.button-primary */
	defaultStyleId: z.string().min(1),
	/** All available style IDs for this kind */
	availableStyleIds: z.array(z.string()).readonly(),
});

export type StyleBinding = z.infer<typeof StyleBindingSchema>;

// =============================================================================
// COMPONENT SCHEMA — THE UNIFIED TYPE
// =============================================================================

export const ComponentSchemaZ = z.object({
	// ─── Identity ────────────────────────────────────────────────────────
	kind: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/),
	displayName: z.string().min(1),
	description: z.string().min(1),
	category: z.enum([
		"forms",
		"layout",
		"navigation",
		"feedback",
		"data-display",
		"overlay",
		"media",
		"typography",
		"utility",
	]),
	icon: z.string().optional(),

	// ─── Engine Reference ────────────────────────────────────────────────
	engine: z.enum(["coldlight", "meltui"]),

	// ─── Slots ───────────────────────────────────────────────────────────
	slots: z.record(z.string(), ComponentSlotSchema),

	// ─── Props ───────────────────────────────────────────────────────────
	props: z.record(z.string(), ComponentPropSchema),

	// ─── Style Binding (DTCG token groups — the recipes) ─────────────────
	style: StyleBindingSchema,

	// ─── Composition ─────────────────────────────────────────────────────
	compound: z.boolean(),
	allowedParents: z.array(z.string()).optional(),
	allowedChildren: z.array(z.string()).optional(),

	// ─── States ──────────────────────────────────────────────────────────
	states: z.array(z.string().min(1)).readonly(),

	// ─── Interactions ────────────────────────────────────────────────────
	interactions: z.object({
		modal: z.boolean(),
		selectable: z.boolean(),
		editable: z.boolean(),
		expandable: z.boolean(),
	}),
});

export type ComponentSchema = z.infer<typeof ComponentSchemaZ>;

// =============================================================================
// VALIDATION
// =============================================================================

export function parseComponentSchema(data: unknown): ComponentSchema {
	return ComponentSchemaZ.parse(data);
}

export function safeParseComponentSchema(data: unknown) {
	return ComponentSchemaZ.safeParse(data);
}

export function validateComponentSchema(schema: ComponentSchema): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	for (const [name, slot] of Object.entries(schema.slots)) {
		if (slot.perItem && !schema.compound) {
			errors.push(`slot "${name}" is perItem but compound is false`);
		}
	}

	const hasRequiredSlot = Object.values(schema.slots).some((s) => s.required);
	if (!hasRequiredSlot) {
		errors.push("component must have at least one required slot");
	}

	if (!schema.style.availableStyleIds.includes(schema.style.defaultStyleId)) {
		errors.push(`style defaultStyleId "${schema.style.defaultStyleId}" not in availableStyleIds`);
	}

	for (const id of schema.style.availableStyleIds) {
		if (!id.startsWith(`${schema.kind}-`)) {
			errors.push(`style ID "${id}" must start with kind "${schema.kind}-"`);
		}
	}

	return { valid: errors.length === 0, errors };
}

// =============================================================================
// JSON EXPORT — For VPB consumption
// =============================================================================

export function toJSON(schema: ComponentSchema): Record<string, unknown> {
	return JSON.parse(JSON.stringify(schema));
}
