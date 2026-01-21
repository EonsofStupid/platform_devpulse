/**
 * @file primitives/button/types.ts
 * @layer primitives
 *
 * Type definitions for Button primitive.
 * Exports ButtonProps for consumers.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

// ============================================
// BUTTON PROPS
// ============================================

/**
 * Props for the Button primitive.
 *
 * Extends native HTMLButtonAttributes minus `style` (enforced no inline styles).
 * Inherits: disabled, type, name, value, form, formAction, etc.
 */
export interface ButtonProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Button content (Svelte 5 snippet) */
  children?: Snippet;

  /** User-defined stable ID for tooling/testing */
  "data-id"?: string;
}

// ============================================
// BUTTON STATE
// ============================================

/**
 * Possible data-state values for Button.
 */
export type ButtonState = "pressed" | "disabled" | undefined;

// ============================================
// BUTTON SLOTS
// ============================================

/**
 * Button has a single root slot.
 */
export const ButtonSlots = ["root"] as const;
export type ButtonSlot = (typeof ButtonSlots)[number];
