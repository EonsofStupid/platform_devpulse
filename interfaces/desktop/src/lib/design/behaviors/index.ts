/**
 * @fileoverview Behaviors - Interaction Modules
 * @file src/lib/design/behaviors/index.ts
 * @module @devpulse/design/behaviors
 * @layer behaviors
 *
 * @description
 * TIER 6: Interaction behaviors - not effects, but interaction modules.
 * These are declared + constrained, not raw event handlers.
 *
 * @since 1.0.0
 */

// ===========================================
// BEHAVIOR TYPES
// ===========================================

export const BehaviorTypes = [
  "hover-intent",      // Delayed hover recognition
  "press-feedback",    // Visual feedback on press
  "pointer-tracking",  // Follow cursor position
  "parallax-tilt",     // 3D tilt effect on hover
  "focus-trap",        // Keyboard focus containment
  "click-outside",     // Detect clicks outside element
  "drag-handle",       // Draggable element
  "resize-handle",     // Resizable element
  "zone-focus",        // Activate zone on mouse enter (section highlighting)
] as const;

export type BehaviorType = typeof BehaviorTypes[number];

// ===========================================
// BEHAVIOR CONFIGS
// ===========================================

export interface HoverIntentConfig {
  delay: number;        // ms before hover is recognized
  exitDelay: number;    // ms before hover ends
}

export interface PressConfig {
  scale: number;        // Scale factor on press (0.95 = 95%)
  duration: number;     // ms for press animation
}

export interface TiltConfig {
  maxAngle: number;     // Max tilt angle in degrees
  perspective: number;  // Perspective distance
  scale: number;        // Scale on hover
}

export interface ZoneFocusConfig {
  activateDelay: number;   // ms before zone activates
  deactivateDelay: number; // ms before zone deactivates
  glowIntensity: "soft" | "hard"; // Glow effect when active
  dimOthers: boolean;      // Dim sibling zones
}

// ===========================================
// BEHAVIOR PRESETS
// ===========================================

export const BehaviorPresets = {
  button: {
    behaviors: ["press-feedback", "focus-trap"] as const,
    press: { scale: 0.97, duration: 100 },
  },
  card: {
    behaviors: ["hover-intent", "parallax-tilt"] as const,
    hoverIntent: { delay: 100, exitDelay: 50 },
    tilt: { maxAngle: 5, perspective: 1000, scale: 1.02 },
  },
  panel: {
    behaviors: ["drag-handle", "resize-handle"] as const,
  },
  modal: {
    behaviors: ["focus-trap", "click-outside"] as const,
  },
  zone: {
    behaviors: ["zone-focus", "hover-intent"] as const,
    zoneFocus: { activateDelay: 50, deactivateDelay: 150, glowIntensity: "soft", dimOthers: true },
    hoverIntent: { delay: 50, exitDelay: 100 },
  },
} as const;

export type BehaviorPreset = keyof typeof BehaviorPresets;

// ===========================================
// BEHAVIOR CONSTRAINTS
// ===========================================

/**
 * Constraints applied by the kernel to prevent behavior abuse
 */
export const BehaviorConstraints = {
  maxConcurrentDrags: 1,
  maxTiltAngle: 15,
  minHoverDelay: 50,
  maxParallaxElements: 5,
} as const;
