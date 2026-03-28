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

import { z } from "zod";
import { A11ySpecSchema } from "./a11y.schema.js";

// =============================================================================
// PRIMITIVE CATEGORY
// =============================================================================

export const PrimitiveCategorySchema = z.enum([
	"interactive", // button, checkbox, switch, toggle
	"form", // input, textarea, select, combobox, slider
	"overlay", // dialog, popover, tooltip, sheet
	"navigation", // tabs, accordion, breadcrumb, nav
	"layout", // box, flex, grid, stack, center, spacer
	"display", // badge, kbd, code, skeleton, spinner
	"feedback", // alert, progress, steps
]);

// =============================================================================
// BASE PRIMITIVE SCHEMA
// =============================================================================

export const BasePrimitiveSchema = z
	.object({
		/** Kebab-case kind identifier. Matches folder name, data-kind, behavior hook. */
		kind: z.string().regex(/^[a-z][a-z0-9-]*$/),
		/** Human-readable label. */
		label: z.string(),
		/** What this primitive does — one sentence. */
		description: z.string(),
		/** Functional category. */
		category: PrimitiveCategorySchema,
		/** Behavior hook name (null for structural/layout primitives). */
		behaviorHook: z.string().nullable(),
		/** Whether this is a compound primitive (multiple sub-elements). */
		compound: z.boolean(),
		/** Accessibility specification — includes per-slot element, role, ARIA attrs. */
		a11y: A11ySpecSchema,
	})
	.refine(
		(data) => {
			// Interactive/form/overlay/navigation primitives MUST have a behavior hook
			const needsHook = ["interactive", "form", "overlay", "navigation"].includes(data.category);
			if (needsHook && !data.behaviorHook) {
				return false;
			}
			return true;
		},
		{
			message: "Interactive, form, overlay, and navigation primitives must declare a behaviorHook",
		},
	)
	.refine(
		(data) => {
			// Compound primitives must have more than one slot
			if (data.compound && Object.keys(data.a11y.slots).length < 2) {
				return false;
			}
			return true;
		},
		{ message: "Compound primitives must declare at least 2 slots" },
	);

export type PrimitiveCategory = z.infer<typeof PrimitiveCategorySchema>;
export type PrimitiveSpec = z.infer<typeof BasePrimitiveSchema>;

// =============================================================================
// definePrimitive() — the authoring function
// =============================================================================

/**
 * Declare a primitive's full contract. Validated at declaration time via Zod.
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
export function definePrimitive(spec: z.input<typeof BasePrimitiveSchema>): PrimitiveSpec {
	return BasePrimitiveSchema.parse(spec);
}

// =============================================================================
// VALIDATION — for build-time gates
// =============================================================================

/**
 * Safe-parse a primitive spec. Returns success/failure without throwing.
 */
export function validatePrimitive(spec: unknown): {
	success: boolean;
	data?: PrimitiveSpec;
	error?: z.ZodError;
} {
	return BasePrimitiveSchema.safeParse(spec) as {
		success: boolean;
		data?: PrimitiveSpec;
		error?: z.ZodError;
	};
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
