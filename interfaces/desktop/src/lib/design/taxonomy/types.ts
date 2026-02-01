/**
 * @file ColdLight Taxonomy Types
 * @package @devpulse/coldlight
 *
 * Core type definitions for the ColdLight design system.
 * EVERY type union is DERIVED from config/coldlight/vocabularies.cfg.ts.
 * No hand-written unions. Data lives in config. Types are derived.
 *
 * Pattern: vocabularies.cfg.ts (as const data) → typeof X[number] (derived types)
 * Powers: CSS generation, manifest output, dev tool validation, DTCG tokens.
 */

import type {
	ARIA_ROLES,
	ARIA_ATTRIBUTES,
	KEYBOARD_KEYS,
	STATE_TOKENS,
	SLOT_ACTIONS,
	ARIA_STATE_PROVIDERS,
	SCAN_ERROR_CODES,
	HTML_ELEMENTS,
	FOCUS_STRATEGIES,
	SLOT_CHILDREN_MODES,
	ORIENTATIONS,
} from "../config/coldlight/vocabularies.cfg.js";

// =============================================================================
// DERIVED VOCABULARY TYPES — all from config const arrays
// =============================================================================

/** Who provides ARIA + state behavior for a primitive */
export type AriaStateProvider = (typeof ARIA_STATE_PROVIDERS)[number];

/**
 * Design-system adapter identifier.
 * These are the behavior providers that run under ColdLight.
 * ColdLight itself is the SSOT system, not an adapter.
 */
export type DsAdapterId = "meltui";

/** ARIA roles — derived from WAI-ARIA 1.2 vocabulary in config */
export type AriaRole = (typeof ARIA_ROLES)[number];

/** ARIA attributes — derived from WAI-ARIA 1.2 vocabulary in config */
export type AriaAttribute = (typeof ARIA_ATTRIBUTES)[number];

/** Keyboard keys — derived from KeyboardEvent.key vocabulary in config */
export type KeyboardKey = (typeof KEYBOARD_KEYS)[number];

/** State tokens for data-state CSS targeting — derived from config */
export type StateToken = (typeof STATE_TOKENS)[number];

/** Slot actions — derived from config */
export type SlotAction = (typeof SLOT_ACTIONS)[number];

/** Scanner error codes — derived from config */
export type ScanErrorCode = (typeof SCAN_ERROR_CODES)[number];

/** HTML element tags for slot rendering — derived from config */
export type HtmlTag = (typeof HTML_ELEMENTS)[number];

/** Focus management strategies — derived from config */
export type FocusStrategy = (typeof FOCUS_STRATEGIES)[number];

/** Slot children rendering modes — derived from config */
export type SlotChildrenMode = (typeof SLOT_CHILDREN_MODES)[number];

/** Directional navigation orientation — derived from config */
export type Orientation = (typeof ORIENTATIONS)[number];

// =============================================================================
// ARIA REQUIREMENTS
// =============================================================================

/**
 * Typed ARIA requirements declared per primitive contract.
 * JSON-serializable. Schema-drivable. Powers dev tool validation.
 */
export interface AriaRequirements {
	readonly role: AriaRole;
	readonly requiredAttrs: readonly AriaAttribute[];
	readonly optionalAttrs: readonly AriaAttribute[];
}

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/**
 * Maps each slot to its allowed states.
 * Ensures type safety between slot names and their valid states.
 */
export type SlotStateMap<
	TSlot extends string,
	TState extends StateToken,
> = Record<TSlot, readonly TState[]>;

// =============================================================================
// SLOT SPECIFICATION — per-slot structural + accessibility spec
// =============================================================================

/**
 * Per-slot ARIA requirements.
 * Declares what ARIA role and attributes the component/adapter layer
 * must apply to THIS specific slot element.
 */
export interface SlotAriaSpec {
	/** ARIA role for this slot (undefined = no explicit role / native semantics) */
	readonly role?: AriaRole;
	/** Attributes the adapter MUST set on this slot */
	readonly required: readonly AriaAttribute[];
	/** Attributes the adapter MAY set on this slot */
	readonly optional: readonly AriaAttribute[];
}

/**
 * Per-slot structural specification.
 * Contains everything a generator needs to produce the correct .svelte file
 * for this specific slot of a primitive.
 *
 * - element: what HTML tag to render ("fragment" = no DOM, just children)
 * - children: how the slot renders content (snippet, self-closing, renderless)
 * - aria: what ARIA role + attributes the component layer applies to this slot
 */
export interface SlotSpec {
	/** HTML element tag this slot renders. "fragment" = no DOM wrapper. */
	readonly element: HtmlTag;
	/** How this slot renders content */
	readonly children: SlotChildrenMode;
	/** Per-slot ARIA requirements (applied by component/adapter layer, NOT primitive) */
	readonly aria: SlotAriaSpec;
}

// =============================================================================
// DISMISS BEHAVIOR — overlay primitives only
// =============================================================================

/**
 * How an overlay primitive can be dismissed.
 * Only applicable to primitives with disclosure/overlay patterns.
 */
export interface DismissBehavior {
	/** Escape key closes the overlay */
	readonly escape: boolean;
	/** Clicking outside the overlay closes it */
	readonly outsideClick: boolean;
}

// =============================================================================
// PRIMITIVE CONTRACT
// =============================================================================

/**
 * The shape of a primitive contract — SSOT for generation + validation.
 *
 * Generic parameters:
 *   TKind  - Literal kind identifier ("dialog", "button", "tabs")
 *   TSlot  - Union of slot names for this primitive
 *   TState - Union of state tokens for this primitive
 *
 * ariaStateProvider declares WHO provides ARIA+state builders:
 *   "meltui"    → dsAdapter handles ARIA, 3-folder parity enforced
 *   "coldlight" → native HTML handles ARIA, 2-folder parity enforced
 *
 * The contract is the COMPLETE specification. It declares every structural
 * element, ARIA requirement, state, keyboard interaction, and behavior that
 * a primitive WILL HAVE when fully built as a component. The contract is
 * adapter-agnostic — it doesn't care if meltui, react-aria, ark/zag, or
 * hand-rolled code fulfills it.
 *
 * DESIGN: No `unknown` types. Every field is typed from a vocabulary.
 * JSON-serializable. Schema-drivable. Powers CSS generation + dev tools.
 */
export interface PrimitiveContract<
	TKind extends string = string,
	TSlot extends string = string,
	TState extends StateToken = StateToken,
> {
	readonly kind: TKind;

	/** Locked-in: who provides ARIA+state builders deterministically */
	readonly ariaStateProvider: AriaStateProvider;

	// ── Structure ────────────────────────────────────────────────────────────

	/** Slot inventory: required / optional / forbidden */
	readonly slots: {
		readonly required: readonly TSlot[];
		readonly optional: readonly TSlot[];
		readonly forbidden: readonly string[];
	};

	/**
	 * Per-slot structural specification.
	 * Maps every slot to its HTML element, children mode, and ARIA requirements.
	 * This is the primary field that drives primitive file generation.
	 */
	readonly slotSpec: Record<TSlot, SlotSpec>;

	// ── State ────────────────────────────────────────────────────────────────

	/** State inventory: shared across many primitives / specific to this one */
	readonly states: {
		readonly shared: readonly TState[];
		readonly specific: readonly TState[];
	};

	/** Per-slot allowed state map */
	readonly slotStates: SlotStateMap<TSlot, TState>;

	/** Per-slot action declarations — typed from SlotAction vocabulary */
	readonly slotActions: Record<TSlot, readonly SlotAction[]>;

	// ── Accessibility ────────────────────────────────────────────────────────

	/** Primitive-level ARIA summary — primary role + combined attribute inventory */
	readonly aria: AriaRequirements;

	/** Keyboard interaction keys — typed from KeyboardKey vocabulary */
	readonly keyboard: readonly KeyboardKey[];

	// ── Behavior ─────────────────────────────────────────────────────────────

	/** How focus is managed when the primitive is active */
	readonly focusStrategy: FocusStrategy;

	/** Whether this primitive uses context for sub-component coordination */
	readonly compound: boolean;

	/** Primary navigation axis (tabs, toolbar, accordion, select) */
	readonly orientation?: Orientation;

	/** How overlay primitives dismiss (dialog, sheet, popover, tooltip) */
	readonly dismissBehavior?: DismissBehavior;
}

// =============================================================================
// MANIFEST TYPES
// =============================================================================

/**
 * Primitive entry in the generated manifest.
 * Flattened from PrimitiveContract for JSON serialization.
 * Uses the same typed vocabularies as the source contract.
 */
export interface ManifestPrimitive {
	readonly kind: string;
	readonly ariaStateProvider: AriaStateProvider;
	readonly slots: {
		readonly required: readonly string[];
		readonly optional: readonly string[];
		readonly forbidden: readonly string[];
	};
	readonly slotSpec: Record<string, SlotSpec>;
	readonly states: {
		readonly shared: readonly StateToken[];
		readonly specific: readonly StateToken[];
	};
	readonly slotStates: Record<string, readonly StateToken[]>;
	readonly slotActions: Record<string, readonly SlotAction[]>;
	readonly aria: AriaRequirements;
	readonly keyboard: readonly KeyboardKey[];
	readonly focusStrategy: FocusStrategy;
	readonly compound: boolean;
	readonly orientation?: Orientation;
	readonly dismissBehavior?: DismissBehavior;
}

/**
 * The generated ColdLight manifest.
 * Written by scanner, read by registry.
 */
export interface ColdLightManifest {
	readonly version: string;
	readonly generatedAt: string;
	readonly adapters: {
		readonly dsAdapter: string;
	};
	readonly categories: {
		readonly primitives: {
			readonly kinds: readonly ManifestPrimitive[];
		};
	};
}

// =============================================================================
// SCANNER TYPES
// =============================================================================

/**
 * Error from scanner.
 */
export interface ScanError {
	readonly code: ScanErrorCode;
	readonly kind: string;
	readonly detail: string;
}

/**
 * Result of scanning a single primitive for parity.
 */
export interface PrimitiveScanResult {
	readonly kind: string;
	readonly ariaStateProvider: AriaStateProvider;
	readonly hasContract: boolean;
	readonly hasSvelteComponent: boolean;
	readonly missingAdapters: readonly DsAdapterId[];
	readonly hasParity: boolean;
}

/**
 * Full scanner result.
 */
export interface ScanResult {
	readonly valid: boolean;
	readonly primitives: readonly PrimitiveScanResult[];
	readonly errors: readonly ScanError[];
	readonly manifest: ColdLightManifest | null;
}
