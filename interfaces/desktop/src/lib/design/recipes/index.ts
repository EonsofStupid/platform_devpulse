/**
 * @fileoverview Recipes - Style Composition Registry
 * @file src/lib/design/recipes/index.ts
 * @module @devpulse/design/recipes
 * @layer recipes
 *
 * @description
 * SSOT for recipe definitions. Maps (kind + variant) → Tailwind classes.
 * Recipes consume tokens. Components consume recipes.
 *
 * @since 1.0.0
 */

import type { BlockKind } from "../taxonomy/kinds";

// ===========================================
// RECIPE TYPES
// ===========================================

export type ActionId = "glowTrack" | "ripple" | "tilt" | "focusTrap";

export interface RecipeDefinition {
  /** Unique recipe ID */
  id: string;
  /** Block kind this recipe applies to */
  kind: BlockKind;
  /** Human description */
  description: string;
  /** Tailwind classes per slot */
  classes: Record<string, string>;
  /** Actions this recipe requires */
  requires?: ActionId[];
}

// ===========================================
// DURATION / EASING (from motion)
// ===========================================

export const Duration = {
  instant: "0ms",
  fast: "var(--dp-duration-fast)",
  normal: "var(--dp-duration-normal)",
  slow: "var(--dp-duration-slow)",
} as const;

export type DurationToken = keyof typeof Duration;

export const Easing = {
  linear: "linear",
  easeOut: "var(--dp-ease-out)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

export type EasingToken = keyof typeof Easing;

// ===========================================
// MOTION PRESETS
// ===========================================

export const MotionPresets = {
  fadeIn: { keyframes: "fadeIn", duration: "fast", easing: "easeOut" },
  fadeOut: { keyframes: "fadeOut", duration: "fast", easing: "easeOut" },
  slideUp: { keyframes: "slideUp", duration: "normal", easing: "easeOut" },
  slideDown: { keyframes: "slideDown", duration: "normal", easing: "easeOut" },
  scaleIn: { keyframes: "scaleIn", duration: "fast", easing: "easeOut" },
  pulse: { keyframes: "pulse", duration: "slow", easing: "easeInOut" },
} as const;

export type MotionPreset = keyof typeof MotionPresets;

// ===========================================
// MOTION BUDGETS
// ===========================================

export const MotionBudgets = {
  reduced: { maxDuration: 0, maxConcurrent: 0 },
  minimal: { maxDuration: 150, maxConcurrent: 2 },
  default: { maxDuration: 500, maxConcurrent: 5 },
  full: { maxDuration: 1000, maxConcurrent: 10 },
} as const;

export type MotionBudget = keyof typeof MotionBudgets;

// ===========================================
// RECIPE REGISTRY
// ===========================================

export const recipeRegistry: Record<string, RecipeDefinition> = {
  // Panel recipes
  "panel.glass.default": {
    id: "panel.glass.default",
    kind: "panel",
    description: "Glass panel with backdrop blur",
    classes: {
      root: "bg-dp-glass-deep backdrop-blur-md rounded-dp-md border border-white/10",
      header: "px-dp-4 py-dp-2 border-b border-white/5",
      body: "px-dp-4 py-dp-3",
      footer: "px-dp-4 py-dp-2 border-t border-white/5",
    },
  },
  "panel.glass.glow": {
    id: "panel.glass.glow",
    kind: "panel",
    description: "Glass panel with glow effect",
    classes: {
      root: "bg-dp-glass-deep backdrop-blur-md rounded-dp-md border border-white/10 shadow-dp-glow-soft",
      header: "px-dp-4 py-dp-2 border-b border-white/5",
      body: "px-dp-4 py-dp-3",
      footer: "px-dp-4 py-dp-2 border-t border-white/5",
    },
    requires: ["glowTrack"],
  },
  "panel.solid.default": {
    id: "panel.solid.default",
    kind: "panel",
    description: "Solid matte panel",
    classes: {
      root: "bg-dp-matte-1 rounded-dp-md border border-white/5",
      header: "px-dp-4 py-dp-2 border-b border-white/5",
      body: "px-dp-4 py-dp-3",
      footer: "px-dp-4 py-dp-2 border-t border-white/5",
    },
  },

  // Shell recipes
  "shell.app.default": {
    id: "shell.app.default",
    kind: "appShell",
    description: "App shell with 5-layer grid",
    classes: {
      root: "grid grid-rows-shell grid-cols-1 h-full w-full",
      topBar: "row-start-1",
      sideNav: "row-start-2 col-start-1",
      main: "row-start-2 col-start-1 overflow-auto",
      statusBar: "row-start-3",
      dock: "fixed bottom-dp-4 right-dp-4",
    },
  },
  "shell.topBar.default": {
    id: "shell.topBar.default",
    kind: "topBar",
    description: "Top bar with 3-column grid",
    classes: {
      root: "grid grid-cols-3 items-center px-dp-4 h-12 bg-dp-glass-void backdrop-blur-sm border-b border-white/5",
      left: "justify-self-start",
      center: "justify-self-center",
      right: "justify-self-end",
    },
  },

  // Card recipes
  "card.glass.default": {
    id: "card.glass.default",
    kind: "card",
    description: "Glass card surface",
    classes: {
      root: "bg-dp-glass-smoke backdrop-blur-sm rounded-dp-md border border-white/10 p-dp-4",
      header: "mb-dp-2",
      body: "",
      footer: "mt-dp-2 pt-dp-2 border-t border-white/5",
    },
  },
} as const;

// ===========================================
// REGISTRY HELPERS
// ===========================================

/**
 * Get a recipe by ID.
 */
export function getRecipe(id: string): RecipeDefinition | undefined {
  return recipeRegistry[id];
}

/**
 * Get all recipes for a kind.
 */
export function getRecipesForKind(kind: BlockKind): RecipeDefinition[] {
  return Object.values(recipeRegistry).filter((r) => r.kind === kind);
}

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ===========================================
// RE-EXPORTS
// ===========================================
export * from "./actions";
