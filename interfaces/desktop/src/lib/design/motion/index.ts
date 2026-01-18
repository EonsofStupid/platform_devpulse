/**
 * @fileoverview Motion - Keyframes, Presets, Budgets
 * @file src/lib/design/motion/index.ts
 * @module @devpulse/design/motion
 * @layer motion
 *
 * @description
 * TIER 5: Animation system - keyframes, presets, performance budgets.
 * Motion is optional - only add new keyframes when a surface requires them.
 *
 * @since 1.0.0
 */

// ===========================================
// DURATION TOKENS
// ===========================================

export const Duration = {
  instant: "0ms",
  fast: "var(--dp-duration-fast)",
  normal: "var(--dp-duration-normal)",
  slow: "var(--dp-duration-slow)",
} as const;

export type DurationToken = keyof typeof Duration;

// ===========================================
// EASING TOKENS
// ===========================================

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
  fadeIn: {
    keyframes: "fadeIn",
    duration: "fast",
    easing: "easeOut",
  },
  fadeOut: {
    keyframes: "fadeOut",
    duration: "fast",
    easing: "easeOut",
  },
  slideUp: {
    keyframes: "slideUp",
    duration: "normal",
    easing: "easeOut",
  },
  slideDown: {
    keyframes: "slideDown",
    duration: "normal",
    easing: "easeOut",
  },
  scaleIn: {
    keyframes: "scaleIn",
    duration: "fast",
    easing: "easeOut",
  },
  pulse: {
    keyframes: "pulse",
    duration: "slow",
    easing: "easeInOut",
  },
} as const;

export type MotionPreset = keyof typeof MotionPresets;

// ===========================================
// PERFORMANCE BUDGETS
// ===========================================

/**
 * Animation budget constraints for different contexts
 */
export const MotionBudgets = {
  /** No animations - accessibility mode */
  reduced: {
    maxDuration: 0,
    maxConcurrent: 0,
  },
  /** Light animations only */
  minimal: {
    maxDuration: 150,
    maxConcurrent: 2,
  },
  /** Default - balanced */
  default: {
    maxDuration: 500,
    maxConcurrent: 5,
  },
  /** Rich animations allowed */
  full: {
    maxDuration: 1000,
    maxConcurrent: 10,
  },
} as const;

export type MotionBudget = keyof typeof MotionBudgets;

// ===========================================
// REDUCED MOTION CHECK
// ===========================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
