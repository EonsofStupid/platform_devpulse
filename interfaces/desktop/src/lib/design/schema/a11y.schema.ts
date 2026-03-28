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

// =============================================================================
// HTML Element — what a slot is allowed to render
// =============================================================================

export const HtmlElementSchema = z.enum([
	// Sectioning
	"div",
	"section",
	"article",
	"aside",
	"main",
	"nav",
	"header",
	"footer",
	// Text
	"span",
	"p",
	"strong",
	"em",
	"small",
	// Headings
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	// Interactive
	"button",
	"a",
	"input",
	"select",
	"textarea",
	"output",
	"label",
	// Semantic
	"dialog",
	"details",
	"summary",
	"hr",
	"table",
	"thead",
	"tbody",
	"tfoot",
	"tr",
	"th",
	"td",
	"ol",
	"ul",
	"li",
	"meter",
	"progress",
	// Dynamic
	"svelte:element",
]);

export type HtmlElement = z.infer<typeof HtmlElementSchema>;

// =============================================================================
// ARIA Role — WAI-ARIA 1.2 roles
// =============================================================================

export const AriaRoleSchema = z.enum([
	// Widget
	"button",
	"checkbox",
	"combobox",
	"dialog",
	"alertdialog",
	"grid",
	"gridcell",
	"link",
	"listbox",
	"menu",
	"menubar",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"option",
	"progressbar",
	"radio",
	"radiogroup",
	"scrollbar",
	"searchbox",
	"separator",
	"slider",
	"spinbutton",
	"switch",
	"tab",
	"tablist",
	"tabpanel",
	"textbox",
	"toolbar",
	"tooltip",
	"tree",
	"treeitem",
	"treegrid",
	// Structure
	"group",
	"heading",
	"img",
	"list",
	"listitem",
	"meter",
	"none",
	"note",
	"presentation",
	"region",
	"row",
	"rowgroup",
	"rowheader",
	"cell",
	"columnheader",
	// Landmark
	"banner",
	"complementary",
	"contentinfo",
	"form",
	"main",
	"navigation",
	"search",
	"status",
	// Live
	"alert",
	"log",
	"timer",
]);

export type AriaRole = z.infer<typeof AriaRoleSchema>;

// =============================================================================
// Focus Strategy
// =============================================================================

export const FocusStrategySchema = z.enum([
	"direct", // element itself receives focus
	"roving", // roving tabindex across children (tabs, radio-group)
	"activedescendant", // aria-activedescendant on container (combobox, listbox)
	"trap", // focus trapped within (dialog, modal)
	"none", // no focus management (layout primitives)
]);

// =============================================================================
// Keyboard Binding
// =============================================================================

export const KeyboardBindingSchema = z.object({
	key: z.string(),
	action: z.string(),
	condition: z.string().optional(),
});

// =============================================================================
// Slot Spec — full declaration for ONE anatomy slot
// =============================================================================

export const SlotSpecSchema = z.object({
	/** What HTML element this slot renders */
	element: HtmlElementSchema,
	/** ARIA role (null = native semantics, no explicit role) */
	role: AriaRoleSchema.nullable().default(null),
	/** Required ARIA attributes on this slot */
	ariaAttrs: z.array(z.string()).default([]),
	/** Decorative: aria-hidden="true", not in a11y tree */
	decorative: z.boolean().default(false),
	/** Accepts children (snippets) */
	container: z.boolean().default(true),
	/** Slot may not be in DOM at all times (e.g., dialog content when closed) */
	optional: z.boolean().default(false),
	/** Brief purpose description */
	description: z.string(),
});

export type SlotSpec = z.infer<typeof SlotSpecSchema>;

// =============================================================================
// A11y Spec — the full accessibility contract
// =============================================================================

export const A11ySpecSchema = z.object({
	/** Per-slot specs: element type, role, required attrs */
	slots: z.record(z.string(), SlotSpecSchema),
	/** Keyboard interactions this primitive handles */
	keyboard: z.array(KeyboardBindingSchema),
	/** Focus management strategy */
	focusStrategy: FocusStrategySchema,
	/** WAI-ARIA APG reference URL */
	apgPattern: z.string().url().optional(),
});

export type FocusStrategy = z.infer<typeof FocusStrategySchema>;
export type KeyboardBinding = z.infer<typeof KeyboardBindingSchema>;
export type A11ySpec = z.infer<typeof A11ySpecSchema>;
