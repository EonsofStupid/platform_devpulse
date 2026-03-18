/**
 * @file Component Schema — ONE Registration, Many Outputs
 * @package @devpulse/coldlight
 *
 * This is the SINGLE source of truth for what a ColdLight component IS.
 * One registration per kind. Everything else is generated from it.
 *
 *   → TypeScript types (compile-time)
 *   → JSON manifest (VPB editor introspection)
 *   → Prop panel config (what the editor shows)
 *   → Token mapping (what visual axes apply per slot)
 *   → Slot structure (what children go where, what element, what role)
 *   → State machine (what states exist, what data-state values)
 *   → Recipe binding (which recipe IDs apply, defaults)
 *
 * The ARIA/behavior contract lives in dsAdapters (meltui or coldlight engine).
 * This schema references it via `engine` but does NOT duplicate it.
 * The dsAdapter owns: role, aria-*, tabindex, focus, keyboard.
 * This schema owns: props, tokens, slots (visual), recipes, states (visual).
 *
 * Build-time:  ComponentSchemaZ.parse() — Zod validates
 * Compile-time: satisfies ComponentSchema — TypeScript enforces
 * Runtime:     JSON.stringify() — VPB consumes
 *
 * Pattern derived from: Plasmic registerComponent, Builder.io registerComponent,
 * Framer addPropertyControls, Storybook argTypes. Adapted for ColdLight's
 * token pipeline (SD5 → CSS Custom Properties → Tailwind v4 → v-* encoding).
 */

import { z } from "zod";

// =============================================================================
// PROP TYPE — Discriminated union (ColdLight alpha iteratio.  After first study of Industry patterns,
// we found that most prop types can be captured by a single discriminated union with a
// "type" field. This keeps the schema simpler and more extensible. If we find we need more complex prop types in the future, we
//  can always refactor to separate schemas. For now, this covers the common cases: string, number, boolean, enum, color, slot reference, event handler, object, and array.
//  Each has its own specific fields for VPB editor
// =============================================================================

/** Base fields every prop has regardless of type. */
const PropBase = z.object({
	/** Display label in VPB prop panel */
	label: z.string().min(1),
	/** Help text / tooltip in VPB */
	description: z.string().optional(),
	/** Whether the component requires this prop */
	required: z.boolean().default(false),
	/** Collapse into "Advanced" section in VPB */
	advanced: z.boolean().default(false),
	/** Conditionally hide in VPB based on other prop values */
	hiddenWhen: z.string().optional(),
	/** Group name for organizing in VPB prop panel */
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
		.array(
			z.object({
				value: z.string(),
				label: z.string(),
			}),
		)
		.min(1),
	/** Render as segmented control instead of dropdown */
	segmented: z.boolean().default(false),
});

const ColorPropSchema = PropBase.extend({
	type: z.literal("color"),
	defaultValue: z.string().optional(),
	/** Restrict to token palette or allow any */
	tokenOnly: z.boolean().default(true),
});

const SlotPropSchema = PropBase.extend({
	type: z.literal("slot"),
	/** Which component kinds can be dropped into this slot */
	allowedKinds: z.array(z.string()).optional(),
	/** Whether this slot repeats per item (compound components) */
	repeated: z.boolean().default(false),
});

const EventPropSchema = PropBase.extend({
	type: z.literal("event"),
	/** TypeScript signature as string for VPB display */
	signature: z.string().min(1),
});

const ObjectPropSchema = PropBase.extend({
	type: z.literal("object"),
	/** TypeScript type as string for VPB introspection */
	shape: z.string().min(1),
});

const ArrayPropSchema = PropBase.extend({
	type: z.literal("array"),
	/** TypeScript item type as string */
	itemType: z.string().min(1),
	defaultValue: z.array(z.unknown()).optional(),
});

/** Discriminated union of all prop types. */
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
// SLOT VISUAL — Per-slot token axis mapping
// =============================================================================

/**
 * Declares which token axes a slot receives from the 8-axis encoding system.
 *
 * Root slots typically get all axes. Child slots inherit or get none.
 * This drives: v-* class generation, VPB token controls, recipe resolution.
 *
 * Maps directly to TOKEN_CATEGORY_REGISTRY codes: s/z/d/b/g/f/m/t.
 */
export const SlotTokenAxesSchema = z.object({
	/** s: Surface treatment (glass-void, glass-deep, etc.) */
	surface: z.boolean().default(false),
	/** z: Material / z-depth */
	material: z.boolean().default(false),
	/** d: Shadow depth (z0–z4) */
	depth: z.boolean().default(false),
	/** b: Bevel treatment */
	bevel: z.boolean().default(false),
	/** g: Glow color */
	glow: z.boolean().default(false),
	/** f: Frame/border */
	frame: z.boolean().default(false),
	/** m: Motion animation */
	motion: z.boolean().default(false),
	/** t: Transition speed */
	transition: z.boolean().default(false),
});

export type SlotTokenAxes = z.infer<typeof SlotTokenAxesSchema>;

/** All axes enabled — for root slots. */
export const ALL_AXES: SlotTokenAxes = {
	surface: true,
	material: true,
	depth: true,
	bevel: true,
	glow: true,
	frame: true,
	motion: true,
	transition: true,
};

/** No axes — for child/structural slots that inherit from parent. */
export const NO_AXES: SlotTokenAxes = {
	surface: false,
	material: false,
	depth: false,
	bevel: false,
	glow: false,
	frame: false,
	motion: false,
	transition: false,
};

// =============================================================================
// COMPONENT SLOT — Structure + visual declaration per slot
// =============================================================================

/**
 * Per-slot declaration combining structure and visual concerns.
 *
 * Structure: element, data-slot value, children mode.
 * Visual: which token axes apply, structural classes.
 * State: which data-state values this slot can have.
 *
 * ARIA is NOT here — it lives in the dsAdapter (engine layer).
 * This schema owns the visual/structural contract.
 */
export const ComponentSlotSchema = z.object({
	/** The data-slot value (e.g., "root", "trigger", "content") */
	name: z.string().min(1),
	/** HTML element this slot renders */
	element: z.string().min(1),
	/** Whether this slot is required in the component */
	required: z.boolean(),
	/** Whether this slot repeats per item (compound components) */
	perItem: z.boolean().default(false),
	/** Which token axes this slot receives */
	tokenAxes: SlotTokenAxesSchema,
	/** Base structural classes (Tailwind layout/spacing/typography) */
	structural: z.string().default(""),
	/** Valid data-state values for this slot */
	states: z.array(z.string().min(1)).readonly(),
});

export type ComponentSlot = z.infer<typeof ComponentSlotSchema>;

// =============================================================================
// RECIPE BINDING — Links component to its recipe system
// =============================================================================

/**
 * Declares how this component connects to the recipe system.
 * Recipe IDs follow the pattern: kind.name.variant
 */
export const RecipeBindingSchema = z.object({
	/** Default recipe ID (e.g., "button.default.standard") */
	defaultId: z.string().regex(/^[a-z][\w-]*\.[a-z][\w-]*\.[a-z][\w-]*$/),
	/** All available recipe IDs for this kind */
	availableIds: z.array(z.string()).readonly(),
	/** Default DsSurfaceProps values (token axis defaults) */
	defaults: z.object({
		surface: z.string().optional(),
		material: z.string().optional(),
		depth: z.string().optional(),
		bevel: z.string().optional(),
		glow: z.string().optional(),
		frame: z.string().optional(),
		motion: z.string().optional(),
		transition: z.string().optional(),
		radius: z.string().optional(),
		size: z.string().optional(),
	}),
});

export type RecipeBinding = z.infer<typeof RecipeBindingSchema>;

// =============================================================================
// COMPONENT SCHEMA — THE UNIFIED TYPE
// =============================================================================

/**
 * The complete component registration.
 *
 * ONE of these per kind. Everything else is generated from it.
 *
 * This captures:
 *   - Identity (kind, display name, category, icon)
 *   - Props (typed, with VPB editor controls)
 *   - Slots (structure + token axes + states)
 *   - Recipe binding (default recipe, available recipes, token defaults)
 *   - Composition constraints (compound, allowed parents/children)
 *   - Engine reference (which dsAdapter provides ARIA/behavior)
 *
 * ARIA/behavior is NOT duplicated here — the dsAdapter schema owns that.
 * This schema and the dsAdapter schema are TWO HALVES of the same component:
 *   - ComponentSchema = visual + structural + props + tokens
 *   - AdapterSchema   = ARIA + focus + keyboard + state machine
 *
 * VPB reads BOTH as JSON to build the complete editor experience.
 */
export const ComponentSchemaZ = z.object({
	// ─── Identity ────────────────────────────────────────────────────────
	/** Kebab-case kind identifier (e.g., "combobox", "button", "dialog") */
	kind: z
		.string()
		.min(1)
		.regex(/^[a-z][a-z0-9-]*$/),
	/** Human-readable display name for VPB insert menu */
	displayName: z.string().min(1),
	/** Short description for VPB tooltip */
	description: z.string().min(1),
	/** VPB insert menu category */
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
	/** Icon identifier for VPB insert menu */
	icon: z.string().optional(),

	// ─── Engine Reference ────────────────────────────────────────────────
	/**
	 * Which dsAdapter provides ARIA/behavior for this component.
	 * "coldlight" = ColdLight owns ARIA (60+ kinds, the default)
	 * "meltui"    = MeltUI adapter provides ARIA (complex widgets only)
	 *
	 * The adapter schema is the SEPARATE source of truth for ARIA.
	 * This field is a REFERENCE, not a duplication.
	 */
	engine: z.enum(["coldlight", "meltui"]),

	// ─── Slots ───────────────────────────────────────────────────────────
	/** Per-slot declarations — structure, token axes, states */
	slots: z.record(z.string(), ComponentSlotSchema),

	// ─── Props ───────────────────────────────────────────────────────────
	/**
	 * All consumer-facing props.
	 * Drives: VPB prop panel, TypeScript types, code generation.
	 * Key = prop name. Value = typed prop definition.
	 */
	props: z.record(z.string(), ComponentPropSchema),

	// ─── Recipe ──────────────────────────────────────────────────────────
	/** Links this component to the recipe system */
	recipe: RecipeBindingSchema,

	// ─── Composition ─────────────────────────────────────────────────────
	/** Whether this is a compound component (has per-item slots) */
	compound: z.boolean(),
	/** Which component kinds can be parents of this component */
	allowedParents: z.array(z.string()).optional(),
	/** Which component kinds can be children of this component */
	allowedChildren: z.array(z.string()).optional(),

	// ─── States ──────────────────────────────────────────────────────────
	/**
	 * All data-state values this component can be in.
	 * These drive: CSS selectors via [data-state="x"], recipe state styles,
	 * VPB state preview toggle.
	 */
	states: z.array(z.string().min(1)).readonly(),

	// ─── Interactions ────────────────────────────────────────────────────
	/** High-level interaction capabilities (for VPB filtering/grouping) */
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

/** Parse and validate. Throws ZodError if invalid. */
export function parseComponentSchema(data: unknown): ComponentSchema {
	return ComponentSchemaZ.parse(data);
}

/** Safe parse. */
export function safeParseComponentSchema(data: unknown) {
	return ComponentSchemaZ.safeParse(data);
}

/**
 * Deep validation — cross-checks internal consistency.
 * - All slot names in states must exist in slots
 * - perItem slots require compound=true
 * - Recipe defaults must reference valid token IDs
 * - Slot prop types must reference existing slots
 * - allowedParents/allowedChildren should be valid kind names
 */
export function validateComponentSchema(schema: ComponentSchema): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	const _slotNames = new Set(Object.keys(schema.slots));

	// perItem requires compound
	for (const [name, slot] of Object.entries(schema.slots)) {
		if (slot.perItem && !schema.compound) {
			errors.push(`slot "${name}" is perItem but compound is false`);
		}
	}

	// Slot props must reference existing slots
	for (const [_propName, prop] of Object.entries(schema.props)) {
		if (prop.type === "slot" && prop.allowedKinds) {
			// allowedKinds is cross-component, can't validate here — noted for registry-level validation
		}
	}

	// At least one slot must be required
	const hasRequiredSlot = Object.values(schema.slots).some((s) => s.required);
	if (!hasRequiredSlot) {
		errors.push("component must have at least one required slot");
	}

	// Recipe default ID must be in available IDs
	if (!schema.recipe.availableIds.includes(schema.recipe.defaultId)) {
		errors.push(`recipe defaultId "${schema.recipe.defaultId}" not in availableIds`);
	}

	// Recipe IDs must start with the kind
	for (const id of schema.recipe.availableIds) {
		if (!id.startsWith(`${schema.kind}.`)) {
			errors.push(`recipe ID "${id}" must start with kind "${schema.kind}."`);
		}
	}

	return { valid: errors.length === 0, errors };
}

// =============================================================================
// JSON EXPORT — For VPB consumption
// =============================================================================

/** Serialize to plain JSON for VPB. */
export function toJSON(schema: ComponentSchema): Record<string, unknown> {
	return JSON.parse(JSON.stringify(schema));
}
