/**
 * Accessibility schema — WAI-ARIA APG spec declaration per primitive.
 *
 * Every primitive declares its ARIA contract: roles, required attributes,
 * keyboard interactions, and focus strategy. This drives:
 * - Hook implementation (what ARIA to compute)
 * - Testing (what to assert)
 * - Documentation (APG compliance)
 * - VPB (accessibility inspector)
 */

import { z } from "zod";

export const FocusStrategySchema = z.enum([
	"direct", // element itself receives focus
	"roving", // roving tabindex across children (tabs, radio-group)
	"activedescendant", // aria-activedescendant on container (combobox, listbox)
	"trap", // focus trapped within (dialog, modal)
	"none", // no focus management (layout primitives)
]);

export const KeyboardBindingSchema = z.object({
	key: z.string(),
	action: z.string(),
	condition: z.string().optional(),
});

export const A11ySpecSchema = z.object({
	/** Per-part ARIA roles. undefined = no role on that part. */
	roles: z.record(z.string(), z.string().optional()),
	/** Per-part required ARIA attributes. */
	requiredAttrs: z.record(z.string(), z.array(z.string())),
	/** Keyboard interactions this primitive handles. */
	keyboard: z.array(KeyboardBindingSchema),
	/** Focus management strategy. */
	focusStrategy: FocusStrategySchema,
	/** WAI-ARIA APG reference URL. */
	apgPattern: z.string().url().optional(),
});

export type FocusStrategy = z.infer<typeof FocusStrategySchema>;
export type KeyboardBinding = z.infer<typeof KeyboardBindingSchema>;
export type A11ySpec = z.infer<typeof A11ySpecSchema>;
