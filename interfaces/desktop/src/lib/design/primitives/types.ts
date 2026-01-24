/**
 * @file primitives/types.ts
 * @layer primitives
 *
 * Shared type utilities for all primitives.
 * Single source of truth for data attributes and type constraints.
 */

/// <reference types="vite/client" />

import type { HTMLAttributes } from "svelte/elements";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// NAMESPACE-READY DATA ATTRIBUTES
// ============================================
// Single source of truth. Change NS to add prefix later if collisions arise.
const NS = ""; // Empty now, can become "cl-" later

/**
 * ColdLight Data Attribute Vocabulary — SINGLE SOURCE OF TRUTH
 *
 * PRIMITIVES (behavior/accessibility):
 * - kind: identifies the primitive type (e.g., "button", "dialog", "select")
 * - slot: identifies the part within a primitive (e.g., "trigger", "content", "item")
 * - state: tracks interactive state (e.g., "open", "closed", "active", "inactive")
 * - id: user-defined stable ID for testing/tooling
 *
 * RECIPES (visual styling):
 * - surface: background treatment (glass, matte, solid)
 * - material: texture/depth (void, deep, smoke, frost)
 * - motion: animation behavior (subtle, smooth, energetic)
 * - transition: state change animation (fade, slide, scale)
 * - focus: attention/emphasis level (low, medium, high, critical)
 * - layers: z-index layer (base, overlay, modal, toast)
 *
 * See README.md and PRIMITIVE_CONTRACT.md for usage patterns.
 */
export const DATA_ATTRS = {
  // Primitives (behavior)
  kind: `data-${NS}kind`,
  slot: `data-${NS}slot`,
  state: `data-${NS}state`,
  id: `data-${NS}id`,

  // Recipes (visual)
  surface: `data-${NS}surface`,
  material: `data-${NS}material`,
  motion: `data-${NS}motion`,
  transition: `data-${NS}transition`,
  focus: `data-${NS}focus`,
  layers: `data-${NS}layers`,
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

// ============================================
// CLASS UTILITIES
// ============================================

/**
 * Merge class names with Tailwind-aware deduplication.
 * Uses clsx for conditional classes + tailwind-merge for specificity.
 *
 * @example
 * cn("px-2 py-1", "px-4") // => "py-1 px-4" (px-4 wins)
 * cn("text-red-500", props.class, className) // => merged result
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
