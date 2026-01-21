/**
 * @file primitives/types.ts
 * @layer primitives
 *
 * Shared type utilities for all primitives.
 * Single source of truth for data attributes and type constraints.
 */

/// <reference types="vite/client" />

import type { HTMLAttributes } from "svelte/elements";

// ============================================
// NAMESPACE-READY DATA ATTRIBUTES
// ============================================
// Single source of truth. Change NS to add prefix later if collisions arise.
const NS = ""; // Empty now, can become "cl-" later

/**
 * Stable data attributes emitted by all primitives.
 * CSS recipes target these selectors.
 *
 * - primitive: identifies the primitive type (e.g., "button", "dialog")
 * - slot: identifies the part within a primitive (e.g., "trigger", "content")
 * - state: tracks interactive state (e.g., "open", "closed", "checked")
 * - id: user-defined stable ID for tooling
 */
export const DATA_ATTRS = {
  primitive: `data-${NS}primitive`,
  slot: `data-${NS}slot`,
  state: `data-${NS}state`,
  id: `data-${NS}id`,
} as const;

// ============================================
// PRIMITIVE STATE VALUES
// ============================================

/**
 * Common state values for primitives.
 * Used with data-state attribute.
 */
export const PrimitiveStates = [
  "open",
  "closed",
  "checked",
  "unchecked",
  "indeterminate",
  "active",
  "inactive",
  "on",
  "off",
  "pressed",
  "loading",
  "disabled",
  "focused",
  "selected",
] as const;

export type PrimitiveState = (typeof PrimitiveStates)[number];

// ============================================
// TYPE UTILITIES
// ============================================

/**
 * Omit 'style' and 'children' props from HTML attributes.
 * - style: enforces "no inline styles" at the type level
 * - children: allows primitives to define custom Snippet signatures
 */
export type OmitStyle<T extends HTMLElement> = Omit<HTMLAttributes<T>, "style" | "children">;

/**
 * Base props for primitives that EXTEND OmitStyle<HTMLElement>.
 * These already get `class` from HTMLAttributes - do NOT redefine it here.
 */
export interface BaseProps {
  /** User-defined stable ID for tooling */
  "data-id"?: string;
}

// ============================================
// RUNTIME ENFORCEMENT
// ============================================

/**
 * DEV-only: Strip style prop from rest and warn.
 * Types alone don't stop JS/any usage.
 */
export function stripStyleProp(
  rest: Record<string, unknown>,
  componentName: string
): void {
  if (import.meta.env?.DEV && "style" in rest) {
    console.warn(
      `[ColdLight] Inline style prop stripped from <${componentName}>. ` +
        `Use recipe classes instead.`
    );
    delete rest.style;
  }
}
