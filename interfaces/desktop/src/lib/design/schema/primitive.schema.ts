/**
 * Base primitive schema — ALL ColdLight primitives extend this.
 *
 * A primitive is the foundational accessible building block.
 * It declares: what it is, what parts it has, what ARIA it requires,
 * and what category it belongs to.
 *
 * definePrimitive() validates at declaration time. If the contract is wrong,
 * it throws immediately. No invalid primitives can exist.
 *
 * Change this schema → every primitive inherits the change.
 */

import { type } from "arktype";
import { type A11ySpec, A11ySpecSchema } from "./a11y.schema.js";

// =============================================================================
// PRIMITIVE CATEGORY
// =============================================================================

export const PRIMITIVE_CATEGORIES = [
	"interactive", // button, checkbox, switch, toggle
	"form", // input, textarea, select, combobox, slider
	"overlay", // dialog, popover, tooltip, sheet
	"navigation", // tabs, accordion, breadcrumb, nav
	"layout", // box, flex, grid, stack, center, spacer
	"display", // badge, kbd, code, skeleton, spinner
	"feedback", // alert, progress, steps
] as const;

export const PrimitiveCategorySchema = type.enumerated(...PRIMITIVE_CATEGORIES);

// =============================================================================
// BASE PRIMITIVE SCHEMA
// =============================================================================

const BasePrimitiveBase = type({
	/** Kebab-case kind identifier. Matches folder name, data-kind, behavior hook. */
	kind: /^[a-z][a-z0-9-]*$/,
	/** Human-readable label. */
	label: "string",
	/** What this primitive does — one sentence. */
	description: "string",
	/** Functional category. */
	category: PrimitiveCategorySchema,
	/** Behavior hook name (null for structural/layout primitives). */
	behaviorHook: "string | null",
	/** Whether this is a compound primitive (multiple sub-elements). */
	compound: "boolean",
	/** Accessibility specification — includes per-slot element, role, ARIA attrs. */
	a11y: A11ySpecSchema,
});

export const BasePrimitiveSchema = BasePrimitiveBase.narrow((data, ctx) => {
	// Interactive/form/overlay/navigation primitives MUST have a behavior hook
	const needsHook = ["interactive", "form", "overlay", "navigation"].includes(data.category);
	if (needsHook && !data.behaviorHook) {
		ctx.mustBe(
			"a primitive with a behaviorHook (required for interactive, form, overlay, and navigation categories)",
		);
		return false;
	}

	// Compound primitives must have more than one slot
	if (data.compound && Object.keys(data.a11y.slots).length < 2) {
		ctx.mustBe("a compound primitive with at least 2 slots");
		return false;
	}

	return true;
});

export type PrimitiveCategory = typeof PrimitiveCategorySchema.infer;

/** Full primitive spec with defaults resolved */
export interface PrimitiveSpec {
	kind: string;
	label: string;
	description: string;
	category: PrimitiveCategory;
	behaviorHook: string | null;
	compound: boolean;
	a11y: A11ySpec;
}

/** Input type for definePrimitive — slot fields can omit defaults */
export type PrimitiveSpecInput = typeof BasePrimitiveBase.infer;

// =============================================================================
// definePrimitive() — the authoring function
// =============================================================================

/**
 * Declare a primitive's full contract. Validated at declaration time via ArkType.
 * If the spec is invalid, this throws immediately. No invalid primitives exist.
 *
 * This is the SSOT for what a primitive IS. The .svelte file must match.
 * The behavior hook must provide the ARIA attrs declared here.
 * The build gate verifies alignment.
 *
 * @example
 * ```ts
 * export const checkboxSpec = definePrimitive({
 *   kind: "checkbox",
 *   label: "Checkbox",
 *   description: "A control that toggles between checked and unchecked.",
 *   category: "interactive",
 *   behaviorHook: "useCheckbox",
 *   compound: true,
 *   a11y: {
 *     slots: {
 *       root: {
 *         element: "button",
 *         role: "checkbox",
 *         ariaAttrs: ["aria-checked", "aria-disabled", "aria-required"],
 *         description: "The toggle control element",
 *       },
 *       indicator: {
 *         element: "span",
 *         decorative: true,
 *         description: "Visual check mark indicator",
 *       },
 *       label: {
 *         element: "label",
 *         description: "Accessible label for the checkbox",
 *       },
 *     },
 *     keyboard: [
 *       { key: "Space", action: "Toggle checked state" },
 *     ],
 *     focusStrategy: "direct",
 *     apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/",
 *   },
 * });
 * ```
 */
export function definePrimitive(spec: PrimitiveSpecInput): PrimitiveSpec {
	const validated = BasePrimitiveSchema.from(spec);
	// ArkType validates the SHAPE but does not materialize the documented
	// defaults — SlotSpec promises role/ariaAttrs/decorative/container/
	// optional are always present, and enforce.ts iterates ariaAttrs
	// unconditionally. Normalize here so the SlotSpec contract is real
	// (surfaced by the first live consumer, checkbox.spec.ts, 2026-07-11).
	const slots = Object.fromEntries(
		Object.entries(validated.a11y.slots).map(([name, s]) => [
			name,
			{
				element: s.element,
				role: s.role ?? null,
				ariaAttrs: s.ariaAttrs ?? [],
				decorative: s.decorative ?? false,
				container: s.container ?? false,
				optional: s.optional ?? false,
				description: s.description,
			},
		]),
	);
	return { ...validated, a11y: { ...validated.a11y, slots } } as PrimitiveSpec;
}

// =============================================================================
// VALIDATION — for build-time gates
// =============================================================================

/**
 * Safe-validate a primitive spec. Returns success/failure without throwing.
 */
export function validatePrimitive(spec: unknown): {
	success: boolean;
	data?: PrimitiveSpec;
	errors?: string[];
} {
	const result = BasePrimitiveSchema(spec);
	if (result instanceof type.errors) {
		return { success: false, errors: result.map((e) => e.message) };
	}
	return { success: true, data: result as PrimitiveSpec };
}

/**
 * Verify a primitive def's slots match its anatomy declaration.
 * The anatomy (from createAnatomy) and the a11y.slots must agree on slot names.
 */
export function validateAnatomyAlignment(
	spec: PrimitiveSpec,
	anatomyParts: readonly string[],
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	const specSlots = new Set(Object.keys(spec.a11y.slots));
	const anatomySlots = new Set(anatomyParts);

	specSlots.forEach((slot) => {
		if (!anatomySlots.has(slot)) {
			errors.push(`Slot "${slot}" in primitive spec but missing from anatomy`);
		}
	});

	anatomySlots.forEach((slot) => {
		if (!specSlots.has(slot)) {
			errors.push(`Slot "${slot}" in anatomy but not declared in primitive spec`);
		}
	});

	return { valid: errors.length === 0, errors };
}
