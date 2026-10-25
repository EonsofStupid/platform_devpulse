/**
 * @file Primitive Types — Full type surface for @devpulse/coldlight
 * @package @devpulse/coldlight
 *
 * All types consumed by scanner, config, components, and registry.
 * Re-exports schema-derived types AND declares additional interfaces.
 */

// Re-export schema-derived types
export type { FocusStrategy, KeyboardKey, StateToken } from "./schema.js";

// =============================================================================
// ARIA Types
// =============================================================================

/** Who provides ARIA state management for this primitive */
export type AriaStateProvider = "coldlight" | "meltui";

/** Which dsAdapter implementation handles this primitive */
export type DsAdapterId = "coldlight" | "meltui";

/** ARIA requirements for a slot */
export interface AriaRequirements {
	role?: string;
	required: readonly string[];
	optional: readonly string[];
}

// =============================================================================
// Slot Types
// =============================================================================

/** Action a slot can perform */
export type SlotAction =
	| "trigger"
	| "close"
	| "dismiss"
	| "navigate"
	| "select"
	| "toggle"
	| "expand"
	| "collapse"
	| "submit"
	| "cancel"
	| "delete"
	| "edit";

/** Slot specification in a primitive contract */
export interface SlotSpec {
	element: string;
	aria: AriaRequirements;
	actions?: readonly SlotAction[];
}

// =============================================================================
// Primitive Types
// =============================================================================

/** Orientation for components that have directional layout */
export type Orientation = "horizontal" | "vertical";

/** Dismiss behavior for overlays/dialogs */
export type DismissBehavior = "close" | "none" | "blur" | "escape";

// =============================================================================
// Scanner Types
// =============================================================================

/** Error codes produced by the contract scanner */
export type ScanErrorCode =
	| "MISSING_CONTRACT"
	| "INVALID_CONTRACT"
	| "MISSING_SLOTS"
	| "INVALID_ARIA"
	| "MISSING_KEYBOARD"
	| "MISSING_STATES"
	| "UNKNOWN_KIND"
	| "DUPLICATE_KIND";

// =============================================================================
// Primitive Contract Interface
// =============================================================================

/**
 * Primitive contract — the ARIA specification for a single primitive kind.
 */
export interface PrimitiveContract {
	/** Primitive kind identifier (e.g., "button", "dialog") */
	kind: string;

	/** Slots this primitive provides */
	slots: {
		required: readonly string[];
		optional: readonly string[];
	};

	/** Per-slot ARIA specification */
	slotSpec: Record<string, SlotSpec>;

	/** Per-slot states */
	slotStates: Record<string, readonly string[]>;

	/** Focus management strategy */
	focusStrategy: import("./schema.js").FocusStrategy;

	/** Keyboard interactions */
	keyboardMap?: readonly {
		key: string;
		action: string;
		focusLocation: string;
	}[];

	/** Slot relationship declarations */
	slotRelationships?: readonly {
		sourceSlot: string;
		targetSlot: string;
		attribute: string;
		required: boolean;
	}[];
}
