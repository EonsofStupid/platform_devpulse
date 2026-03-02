/**
 * @file Effects Actions — Barrel Export
 * @layer effects/actions
 * @package @devpulse/coldlight
 *
 * Svelte 5 actions for JS-driven visual effects.
 * These are wired by the compositor compiler when an effect
 * has a customJS property.
 */

export { intersectionReveal, type IntersectionRevealParams } from "./intersection-reveal.js";
export { glowTrack, type GlowTrackParams } from "./glow-track.js";
