/**
 * @file Taxonomy Adapter Types
 * @description Foundational types for the adapter and primitive system.
 *
 * This file defines the core type contracts that all primitives
 * and adapters must conform to. No imports from primitive contracts -
 * this IS the foundation they build upon.
 */

// =============================================================================
// STATE TOKENS
// =============================================================================

/**
 * State categories organize tokens by semantic purpose.
 * CSS selectors use: [data-state~="token"]
 */
export type StateCategory =
  | "presence"
  | "primary"
  | "focus"
  | "interaction"
  | "availability"
  | "selection"
  | "expansion"
  | "drag"
  | "animation"
  | "validation";

/**
 * State tokens - the complete vocabulary of UI states.
 * Every primitive uses a subset of these.
 */
export type StateToken =
  // Presence: DOM visibility and interactivity
  | "hidden"
  | "visible"
  | "inert"
  // Primary: Core component state
  | "open"
  | "closed"
  // Focus: Keyboard navigation
  | "focused"
  | "focus-visible"
  | "focus-within"
  // Interaction: User input feedback
  | "hover"
  | "active"
  | "pressed"
  // Availability: Can the user interact?
  | "disabled"
  | "readonly"
  // Selection: Multi-select states
  | "selected"
  | "checked"
  | "indeterminate"
  // Expansion: Collapsible content
  | "expanded"
  | "collapsed"
  // Drag: Drag and drop
  | "dragging"
  | "dropping"
  // Animation: Transition states
  | "entering"
  | "exiting"
  // Validation: Form states
  | "valid"
  | "invalid"
  | "loading"
  | "error"
  | "success";

// =============================================================================
// PRIMITIVE CONTRACT
// =============================================================================

/**
 * Behavior provider - who implements ARIA and keyboard handling.
 */
export type BehaviorProvider = "meltui" | "custom";

/**
 * Primitive contract - the complete specification for a primitive.
 *
 * Contracts live in taxonomy/primitives/<kind>/contract.ts
 * They define what a primitive IS, not how it's implemented.
 */
export interface PrimitiveContract {
  /** Unique primitive identifier (folder name) */
  kind: string;

  /** All slots this primitive exposes */
  slots: readonly string[];

  /** Slots that must always be rendered */
  requiredSlots: readonly string[];

  /** All states this primitive can have */
  states: readonly StateToken[];

  /** ARIA specification */
  aria: {
    /** WAI-ARIA role */
    role: string;
    /** Required ARIA attributes */
    requiredAttrs: readonly string[];
  };

  /** Keyboard interactions this primitive handles */
  keyboard: readonly string[];

  /** Who provides ARIA/behavior implementation */
  provider: BehaviorProvider;
}

// =============================================================================
// ADAPTER SYSTEM
// =============================================================================

/**
 * Adapter identifier - the two adapters in ColdLight.
 */
export type AdapterId = "coldlight" | "meltui";

/**
 * Adapter declaration - metadata about an adapter.
 */
export interface AdapterDeclaration {
  /** Unique identifier */
  id: AdapterId;

  /** Human-readable name */
  name: string;

  /** What this adapter provides */
  description: string;

  /** Is this the public API surface? */
  isPublicApi: boolean;

  /** Path to _internal folder (relative to src/lib/design/) */
  internalPath: string;
}

// =============================================================================
// SCANNER RESULTS
// =============================================================================

/**
 * Result from scanning a single primitive for 4-folder parity.
 */
export interface PrimitiveScanResult {
  /** Primitive kind (folder name) */
  kind: string;

  /** taxonomy/primitives/<kind>/ exists */
  hasContract: boolean;

  /** primitives/<kind>/*.svelte exists */
  hasSvelteComponent: boolean;

  /** Which adapters are missing _internal/<kind>/ */
  missingAdapters: AdapterId[];

  /** All 4 folders exist and are valid */
  hasParity: boolean;
}

/**
 * Result from scanning the full registry.
 */
export interface RegistryScanResult {
  /** All primitives found and their parity status */
  primitives: PrimitiveScanResult[];

  /** All adapter ids (always coldlight + meltui) */
  adapters: AdapterId[];

  /** True if every primitive has full parity */
  valid: boolean;

  /** Human-readable error messages for missing folders */
  errors: string[];
}
