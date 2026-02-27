/**
 * @file Motion Effects — Transitions & Animations
 * @layer effects
 * @category motion
 * @package @devpulse/coldlight
 *
 * CSS-only motion effects. No SVG filters needed — transforms,
 * transitions, and keyframe animations handle all motion.
 *
 * No conflict group — multiple motion effects CAN coexist on the
 * same element (hover-lift + press-down on a button is valid).
 *
 * All motion effects respect @media (prefers-reduced-motion: reduce)
 * via the backing molecule CSS utilities.
 *
 * CSS backing: molecules/motion.css (@utility motion-hover-lift, motion-press-down)
 */

import { registerEffect } from "../../registry.js";
import type { EffectDefinition } from "../../_schema/types.js";

// =============================================================================
// HOVER LIFT — element rises on hover
// =============================================================================

const motionHoverLift: EffectDefinition = {
	id: "motion.hover-lift",
	category: "motion",
	label: "Hover Lift",
	description: "Element lifts slightly on hover with subtle transform. Respects prefers-reduced-motion.",
	supportedTriggers: ["hover"],
	classes: ["motion-hover-lift"],
};

// =============================================================================
// PRESS DOWN — element presses on active
// =============================================================================

const motionPressDown: EffectDefinition = {
	id: "motion.press-down",
	category: "motion",
	label: "Press Down",
	description: "Element presses down on active state with scale + translate. Respects prefers-reduced-motion.",
	supportedTriggers: ["active"],
	classes: ["motion-press-down"],
};

// =============================================================================
// FADE IN — element fades in on viewport intersection
// =============================================================================

const motionFadeIn: EffectDefinition = {
	id: "motion.fade-in",
	category: "motion",
	label: "Fade In",
	description: "Element fades in and slides up when entering the viewport. Uses IntersectionObserver.",
	supportedTriggers: ["intersection"],
	classes: ["opacity-0", "translate-y-4"],
	transition: "opacity var(--duration-normal, 300ms) var(--ease-out, ease-out), transform var(--duration-normal, 300ms) var(--ease-out, ease-out)",
	customJS: {
		module: "effects/actions/intersection-reveal",
		defaultParams: { threshold: 0.1, rootMargin: "0px" },
	},
};

// =============================================================================
// PULSE GLOW — slow pulsing attention animation
// =============================================================================

const motionPulseGlow: EffectDefinition = {
	id: "motion.pulse-glow",
	category: "motion",
	label: "Pulse Glow",
	description: "Slow pulsing glow animation for attention-drawing elements. 4s cycle.",
	supportedTriggers: ["always"],
	classes: ["animate-[pulse-glow_4s_ease-in-out_infinite]"],
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerEffect(motionHoverLift);
registerEffect(motionPressDown);
registerEffect(motionFadeIn);
registerEffect(motionPulseGlow);
