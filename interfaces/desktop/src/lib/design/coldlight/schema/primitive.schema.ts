/**
 * Base primitive schema — ALL ColdLight primitives extend this.
 *
 * A primitive is the foundational accessible building block.
 * It declares: what it is, what parts it has, what ARIA it requires,
 * and what category it belongs to.
 *
 * Change this schema → every primitive inherits the change.
 */

import { z } from "zod";
import { A11ySpecSchema } from "./a11y.schema.js";

export const PrimitiveCategorySchema = z.enum([
	"interactive", // button, checkbox, switch, toggle
	"form", // input, textarea, select, combobox, slider
	"overlay", // dialog, popover, tooltip, sheet
	"navigation", // tabs, accordion, breadcrumb, nav
	"layout", // box, flex, grid, stack, center, spacer
	"display", // badge, kbd, code, skeleton, spinner
	"feedback", // alert, progress, steps
]);

export const BasePrimitiveSchema = z.object({
	/** Kebab-case kind identifier. */
	kind: z.string().regex(/^[a-z][a-z0-9-]*$/),
	/** Human-readable label. */
	label: z.string(),
	/** What this primitive does — one sentence. */
	description: z.string(),
	/** Functional category. */
	category: PrimitiveCategorySchema,
	/** Anatomy: ordered list of parts this primitive exposes. */
	parts: z.array(z.string()).min(1),
	/** Accessibility specification. */
	a11y: A11ySpecSchema,
});

export type PrimitiveCategory = z.infer<typeof PrimitiveCategorySchema>;
export type PrimitiveSpec = z.infer<typeof BasePrimitiveSchema>;
