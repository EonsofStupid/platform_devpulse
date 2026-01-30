/**
 * @file Tabs Primitive Types
 * @layer primitives
 * @kind tabs
 *
 * Types for the tabs primitive.
 * Taxonomy types re-exported from SSOT.
 * Props defined locally for the primitive component.
 */

import type { Snippet } from "svelte";
import type {
  TabsSlot,
  TabsState,
} from "$lib/design/taxonomy/kinds/primitives/tabs/contract";

// =============================================================================
// RE-EXPORTS FROM TAXONOMY
// =============================================================================

export type { TabsSlot, TabsState };

// =============================================================================
// PROPS
// =============================================================================

/**
 * Props for the Tabs root component.
 */
export interface TabsProps {
  /** Default selected tab value */
  defaultValue?: string;

  /** Controlled selected value */
  value?: string;

  /** Callback when selected tab changes */
  onValueChange?: (value: string) => void;

  /** Orientation of tabs (affects keyboard navigation) */
  orientation?: "horizontal" | "vertical";

  /** Activate on focus (automatic) or on click (manual) */
  activationMode?: "automatic" | "manual";

  /** Loop keyboard navigation */
  loop?: boolean;

  /** CSS class */
  class?: string;

  /** Children (TabsList, TabsContent) */
  children?: Snippet;
}

/**
 * Props for the TabsTrigger component.
 */
export interface TabsTriggerProps {
  /** Tab value (must match corresponding TabsContent value) */
  value: string;

  /** Disabled state */
  disabled?: boolean;

  /** CSS class */
  class?: string;

  /** Trigger content */
  children?: Snippet;
}

/**
 * Props for the TabsContent component.
 */
export interface TabsContentProps {
  /** Tab value (must match corresponding TabsTrigger value) */
  value: string;

  /** CSS class */
  class?: string;

  /** Panel content */
  children?: Snippet;
}
