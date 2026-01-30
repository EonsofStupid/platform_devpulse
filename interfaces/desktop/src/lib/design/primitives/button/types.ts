/**
 * @file Button Primitive Types
 * @layer primitives
 * @kind button
 *
 * Types for the button primitive.
 * Taxonomy types re-exported from SSOT.
 * Props defined locally for the primitive component.
 */

import type { Snippet } from "svelte";
import type {
  ButtonSlot,
  ButtonState,
} from "$lib/design/taxonomy/kinds/primitives/button/contract";

// =============================================================================
// RE-EXPORTS FROM TAXONOMY
// =============================================================================

export type { ButtonSlot, ButtonState };

// =============================================================================
// VARIANT & SIZE
// =============================================================================

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

// =============================================================================
// PROPS
// =============================================================================

/**
 * Props for the Button primitive.
 * ColdLight owns ALL ARIA — this is a native button, no adapter.
 */
export interface ButtonProps {
  /** Visual variant */
  variant?: ButtonVariant;

  /** Size preset */
  size?: ButtonSize;

  /** HTML button type */
  type?: "button" | "submit" | "reset";

  /** Disabled state (uses aria-disabled, not native disabled) */
  disabled?: boolean;

  /** Loading state (shows spinner, sets aria-busy) */
  loading?: boolean;

  /** Toggle pressed state (sets aria-pressed) */
  pressed?: boolean;

  /** Accessible label for icon-only buttons */
  "aria-label"?: string;

  /** CSS class */
  class?: string;

  /** Click handler */
  onclick?: (e: MouseEvent) => void;

  /** Button content */
  children?: Snippet;

  /** Icon snippet (rendered before label) */
  icon?: Snippet;
}
