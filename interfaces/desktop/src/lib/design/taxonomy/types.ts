/**
 * @file ColdLight Taxonomy Types
 * @package @devpulse/coldlight
 *
 * Core type definitions for the ColdLight design system.
 * These types define the SHAPE of contracts, manifests, and scanner results.
 */

// =============================================================================
// ADAPTER TYPES
// =============================================================================

/** Who provides ARIA + state behavior for a primitive */
export type AriaStateProvider = "meltui" | "coldlight";

/**
 * Design-system adapter identifier.
 * These are the behavior providers that run under ColdLight.
 * ColdLight itself is the SSOT system, not an adapter.
 */
export type DsAdapterId = "meltui";

// =============================================================================
// STATE TOKENS
// =============================================================================

/**
 * Standard state tokens available to all primitives.
 * These map to data-state attributes for CSS targeting.
 */
export type StateToken =
  // Presence
  | "hidden"
  | "visible"
  | "inert"
  // Primary
  | "open"
  | "closed"
  | "selected"
  | "checked"
  | "indeterminate"
  | "disabled"
  | "readonly"
  | "required"
  | "invalid"
  | "valid"
  // Focus
  | "focused"
  | "focus-visible"
  | "focus-within"
  // Interaction
  | "hover"
  | "active"
  | "pressed"
  // Loading
  | "loading"
  | "pending"
  | "busy"
  // Animation
  | "entering"
  | "exiting"
  // Position
  | "expanded"
  | "collapsed";

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/**
 * Maps each slot to its allowed states.
 * Ensures type safety between slot names and their valid states.
 */
export type SlotStateMap<
  TSlot extends string,
  TState extends StateToken
> = Record<TSlot, readonly TState[]>;

// =============================================================================
// PRIMITIVE CONTRACT (Generic)
// =============================================================================

/**
 * The shape of a primitive contract.
 *
 * Generic parameters:
 *   TKind          - Literal kind identifier ("dialog", "button", "tabs")
 *   TSlot          - Union of slot names for this primitive
 *   TState         - Union of state tokens for this primitive
 *   TCollectionKey - Union of collection keys ("aria" | "keyboard" etc)
 *
 * ariaStateProvider declares WHO provides ARIA+state builders.
 * MeltUI-backed primitives: "meltui"
 * ColdLight custom ARIA:   "coldlight"
 */
export interface PrimitiveContract<
  TKind extends string = string,
  TSlot extends string = string,
  TState extends StateToken = StateToken,
  TCollectionKey extends string = string
> {
  readonly kind: TKind;

  /** Locked-in: who provides ARIA+state builders deterministically */
  readonly ariaStateProvider: AriaStateProvider;

  /** Slot inventory: required / optional / forbidden */
  readonly slots: {
    readonly required: readonly TSlot[];
    readonly optional: readonly TSlot[];
    readonly forbidden: readonly string[];
  };

  /** State inventory: shared across many primitives / specific to this one */
  readonly states: {
    readonly shared: readonly TState[];
    readonly specific: readonly TState[];
  };

  /** Per-slot allowed state map */
  readonly slotStates: SlotStateMap<TSlot, TState>;

  /** Per-slot action declarations (even if empty right now) */
  readonly slotActions: Record<TSlot, readonly string[]>;

  /** Metadata/inventories accessed via get(key) */
  readonly collections: {
    get(key: TCollectionKey): unknown;
  };
}

// =============================================================================
// MANIFEST TYPES
// =============================================================================

/**
 * Primitive entry in the generated manifest.
 * Flattened from PrimitiveContract for JSON serialization.
 * collections.get() is unwound into concrete aria/keyboard fields.
 */
export interface ManifestPrimitive {
  readonly kind: string;
  readonly ariaStateProvider: AriaStateProvider;
  readonly slots: {
    readonly required: readonly string[];
    readonly optional: readonly string[];
    readonly forbidden: readonly string[];
  };
  readonly states: {
    readonly shared: readonly string[];
    readonly specific: readonly string[];
  };
  readonly slotStates: Record<string, readonly string[]>;
  readonly slotActions: Record<string, readonly string[]>;
  readonly aria: {
    readonly role: string;
    readonly requiredAttrs: readonly string[];
    readonly optionalAttrs: readonly string[];
  };
  readonly keyboard: readonly string[];
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

/** Error codes from scanner */
export type ScanErrorCode =
  | "PARITY_MISSING_FOLDER"
  | "CONTRACT_LOAD_FAILED"
  | "CONTRACT_INVALID";

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
  readonly hasContract: boolean;
  readonly hasColdlight: boolean;
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
