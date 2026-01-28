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

/** Adapter providers supported by ColdLight */
export type AdapterProvider = "meltui" | "custom";

/** Branded adapter identifier */
export type AdapterId = "coldlight" | "meltui";

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
// PRIMITIVE CONTRACT
// =============================================================================

/**
 * The shape of a primitive contract.
 * Each primitive declares its slots, states, ARIA, and keyboard requirements.
 */
export interface PrimitiveContract {
  /** Unique kind identifier (e.g., "dialog", "button", "tabs") */
  readonly kind: string;

  /** All slots this primitive exposes */
  readonly slots: readonly string[];

  /** Slots that MUST be rendered for accessibility */
  readonly requiredSlots: readonly string[];

  /** All states this primitive can be in */
  readonly states: readonly StateToken[];

  /** ARIA requirements */
  readonly aria: {
    /** Primary ARIA role */
    readonly role: string;
    /** Required ARIA attributes */
    readonly requiredAttrs: readonly string[];
  };

  /** Keyboard interactions this primitive handles */
  readonly keyboard: readonly string[];

  /** Which adapter provides behavior */
  readonly provider: AdapterProvider;
}

// =============================================================================
// MANIFEST TYPES
// =============================================================================

/**
 * Primitive entry in the generated manifest.
 */
export interface ManifestPrimitive {
  readonly kind: string;
  readonly provider: AdapterProvider;
  readonly slots: readonly string[];
  readonly requiredSlots: readonly string[];
  readonly states: readonly string[];
  readonly aria: {
    readonly role: string;
    readonly requiredAttrs: readonly string[];
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
    readonly enabled: readonly string[];
    readonly defaultActive: string;
    readonly ariaStateProvider: string;
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
  readonly hasSvelteComponent: boolean;
  readonly missingAdapters: readonly AdapterId[];
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
