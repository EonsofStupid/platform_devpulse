/**
 * Anatomy schema — machine-readable slot/part declaration with AI guidance metadata.
 *
 * Every ColdLight primitive declares its anatomy: what parts it has,
 * what HTML elements they render as, what ARIA requirements they carry,
 * and what content they accept.
 *
 * This metadata serves three consumers:
 * 1. Preflight checks — error messages with fix instructions
 * 2. Runtime dev console — guidance when slots are misused
 * 3. VPB / XML injector — structural understanding for no-code editing
 *
 * Pattern evolved from Ark UI's createAnatomy — enriched with AI-aware metadata.
 */

// ═══════════════════════════════════════════════════════════════
// SLOT METADATA
// ═══════════════════════════════════════════════════════════════

/** Valid HTML element types for a slot */
export type SlotElement =
	| "div"
	| "span"
	| "p"
	| "section"
	| "article"
	| "aside"
	| "main"
	| "nav"
	| "header"
	| "footer"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "button"
	| "a"
	| "input"
	| "textarea"
	| "select"
	| "label"
	| "form"
	| "fieldset"
	| "legend"
	| "dialog"
	| "details"
	| "summary"
	| "table"
	| "thead"
	| "tbody"
	| "tr"
	| "th"
	| "td"
	| "ul"
	| "ol"
	| "li"
	| "dl"
	| "dt"
	| "dd"
	| "svg"
	| "meter"
	| "progress"
	| "output"
	| "small"
	| "strong"
	| "em";

/** Content types a slot can accept */
export type SlotAccepts = "any" | "text" | "interactive" | "structural" | "media" | "none";

/** ARIA requirements for a slot */
export interface SlotAria {
	/** Required ARIA role. Omit if semantic element provides it. */
	role?: string;
	/** Required aria-* attributes */
	required?: string[];
	/** Conditional aria-* attributes (applied based on state) */
	conditional?: string[];
}

/** Keyboard interaction pattern for a slot */
export interface SlotKeyboard {
	/** Keys that activate this slot (e.g., ["Space", "Enter"]) */
	activates?: string[];
	/** Keys for navigation within this slot (e.g., ["ArrowUp", "ArrowDown"]) */
	navigates?: string[];
	/** Key to dismiss/close (e.g., "Escape") */
	dismisses?: string;
	/** Whether this slot receives focus via Tab */
	focusable?: boolean;
}

/** Complete metadata for a single anatomy slot */
export interface SlotMeta {
	/** Human/AI readable description of what this slot is for */
	description: string;
	/** Expected semantic HTML element(s) for this slot */
	element: SlotElement | SlotElement[];
	/** Whether this slot must be rendered */
	required: boolean;
	/** ARIA role and attribute requirements */
	aria?: SlotAria;
	/** What child content types this slot accepts */
	accepts?: SlotAccepts[];
	/** Data attributes this slot emits for state (e.g., ["data-disabled", "data-state"]) */
	stateAttrs?: string[];
	/** Keyboard interaction contract */
	keyboard?: SlotKeyboard;
	/** Whether this slot can appear multiple times (e.g., list items) */
	repeatable?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ANATOMY TYPES
// ═══════════════════════════════════════════════════════════════

/** Per-slot attrs type — each slot narrows data-slot to its own literal */
export type AnatomyAttrs<K extends string, T extends string> = {
	readonly [P in T]: { "data-kind": K; "data-slot": P };
};

/** Per-slot metadata map */
export type AnatomyMeta<T extends string> = {
	readonly [P in T]: SlotMeta;
};

/** Complete anatomy declaration with metadata */
export interface Anatomy<K extends string = string, T extends string = string> {
	/** The primitive kind name */
	readonly kind: K;
	/** Ordered list of slot names */
	readonly parts: readonly T[];
	/** Data attributes to spread on each slot's DOM element */
	readonly attrs: AnatomyAttrs<K, T>;
	/** AI-readable metadata per slot — descriptions, elements, ARIA, accepts */
	readonly meta: AnatomyMeta<T>;
}

// ═══════════════════════════════════════════════════════════════
// TYPE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Extract slot names where `required: true` from an anatomy declaration.
 * Components use this to enforce that all required slots are rendered.
 *
 * @example
 * ```typescript
 * type Required = RequiredSlots<typeof dialogAnatomy>;
 * // => "content" | "title"
 * ```
 */
export type RequiredSlots<A extends Anatomy> = {
	[K in A["parts"][number]]: A["meta"][K] extends { required: true } ? K : never;
}[A["parts"][number]];

/**
 * Extract slot names where `required: false` or omitted from an anatomy declaration.
 */
export type OptionalSlots<A extends Anatomy> = Exclude<A["parts"][number], RequiredSlots<A>>;

// ═══════════════════════════════════════════════════════════════
// SLOT DEFINITION INPUT
// ═══════════════════════════════════════════════════════════════

/** Input shape for defining slots — what you pass to createAnatomy */
export type SlotDefinitions<T extends string> = {
	[P in T]: SlotMeta;
};

// ═══════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Create an anatomy declaration for a primitive kind.
 *
 * @param kind - The primitive kind name (e.g., "card", "field", "dialog")
 * @param slots - Slot definitions with metadata per slot
 * @returns Frozen anatomy with attrs + meta for consumers
 *
 * @example
 * ```typescript
 * export const cardAnatomy = createAnatomy("card", {
 *   root: {
 *     description: "Card container — the outermost surface element",
 *     element: "article",
 *     required: true,
 *     aria: { role: "group" },
 *     accepts: ["structural"],
 *   },
 *   header: {
 *     description: "Card header — title and actions",
 *     element: "header",
 *     required: false,
 *     accepts: ["text", "interactive"],
 *   },
 *   body: {
 *     description: "Card body — main content area",
 *     element: "div",
 *     required: true,
 *     accepts: ["any"],
 *   },
 * });
 * ```
 */
export function createAnatomy<const K extends string, const S extends SlotDefinitions<string>>(
	kind: K,
	slots: S,
): Anatomy<K, Extract<keyof S, string>> {
	type SlotName = Extract<keyof S, string>;

	const parts = Object.keys(slots) as SlotName[];

	const attrs = {} as Record<string, { "data-kind": K; "data-slot": string }>;
	const meta = {} as Record<string, SlotMeta>;

	for (const part of parts) {
		attrs[part] = { "data-kind": kind, "data-slot": part };
		meta[part] = slots[part];
	}

	return Object.freeze({
		kind,
		parts: Object.freeze(parts),
		attrs: Object.freeze(attrs),
		meta: Object.freeze(meta),
	}) as unknown as Anatomy<K, SlotName>;
}
