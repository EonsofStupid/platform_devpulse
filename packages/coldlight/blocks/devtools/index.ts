/**
 * @file Devtool Blocks Barrel
 * @description Pre-composed dashboard surfaces for the devtools cockpit
 * — tiles, status overlays, baseline-establishment widgets. Every block
 * composes ColdLight primitives + dialog blocks; no block here authors
 * markup or CSS that an existing primitive covers.
 *
 * Drives the locked baseline-establishment standard
 * (feedback_devtools_are_dev_diagnostics 2026-05-14): the devtool
 * surface IS where the auto-tuned baseline gets established. Every
 * subsystem tile must surface live status + one-click verbs without
 * forcing the dev to navigate.
 */

export {
	default as SubsystemTile,
	type SubsystemState,
	type SubsystemTone,
	type SubsystemVerb,
} from "./SubsystemTile.svelte";
