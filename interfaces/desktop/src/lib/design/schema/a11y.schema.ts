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

import { type } from "arktype";

// =============================================================================
// HTML Element — what a slot is allowed to render
// =============================================================================

export const HTML_ELEMENTS = [
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
] as const;

export const HtmlElementSchema = type.enumerated(...HTML_ELEMENTS);

export type HtmlElement = typeof HtmlElementSchema.infer;

// =============================================================================
// ARIA Role — WAI-ARIA 1.2 roles
// =============================================================================

export const ARIA_ROLES = [
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
] as const;

export const AriaRoleSchema = type.enumerated(...ARIA_ROLES);

export type AriaRole = typeof AriaRoleSchema.infer;

// =============================================================================
// Focus Strategy
// =============================================================================

export const FOCUS_STRATEGIES = [
	"direct", // element itself receives focus
	"roving", // roving tabindex across children (tabs, radio-group)
	"activedescendant", // aria-activedescendant on container (combobox, listbox)
	"trap", // focus trapped within (dialog, modal)
	"none", // no focus management (layout primitives)
] as const;

export const FocusStrategySchema = type.enumerated(...FOCUS_STRATEGIES);

// =============================================================================
// Keyboard Binding
// =============================================================================

export const KeyboardBindingSchema = type({
	key: "string",
	action: "string",
	"condition?": "string",
});

// =============================================================================
// Slot Spec — full declaration for ONE anatomy slot
// =============================================================================

export const SlotSpecSchema = type({
	/** What HTML element this slot renders */
	element: HtmlElementSchema,
	/** ARIA role (null = native semantics, no explicit role) */
	"role?": AriaRoleSchema.or("null"),
	/** Required ARIA attributes on this slot */
	"ariaAttrs?": "string[]",
	/** Decorative: aria-hidden="true", not in a11y tree */
	"decorative?": "boolean",
	/** Accepts children (snippets) */
	"container?": "boolean",
	/** Slot may not be in DOM at all times (e.g., dialog content when closed) */
	"optional?": "boolean",
	/** Brief purpose description */
	description: "string",
});

/** SlotSpec with defaults applied — what consumers use after validation */
export interface SlotSpec {
	element: HtmlElement;
	role: AriaRole | null;
	ariaAttrs: string[];
	decorative: boolean;
	container: boolean;
	optional: boolean;
	description: string;
}

/** SlotSpec input — what authors write (optional fields have defaults) */
export type SlotSpecInput = typeof SlotSpecSchema.infer;

// =============================================================================
// A11y Spec — the full accessibility contract
// =============================================================================

export const A11ySpecSchema = type({
	/** Per-slot specs: element type, role, required attrs */
	slots: type({ "[string]": SlotSpecSchema }),
	/** Keyboard interactions this primitive handles */
	keyboard: KeyboardBindingSchema.array(),
	/** Focus management strategy */
	focusStrategy: FocusStrategySchema,
	/** WAI-ARIA APG reference URL */
	"apgPattern?": "string.url",
});

export type FocusStrategy = typeof FocusStrategySchema.infer;
export type KeyboardBinding = typeof KeyboardBindingSchema.infer;

/** A11ySpec with defaults applied — what consumers use after validation */
export interface A11ySpec {
	slots: Record<string, SlotSpec>;
	keyboard: KeyboardBinding[];
	focusStrategy: FocusStrategy;
	apgPattern?: string;
}

/** A11ySpec input — what authors write (slot fields can omit defaults) */
export type A11ySpecInput = typeof A11ySpecSchema.infer;
