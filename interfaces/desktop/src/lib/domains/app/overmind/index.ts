/**
 * @file domains/app/overmind/index.ts
 * @module @devpulse/domains/app/overmind
 * @description Overmind — experimental hub (Nx library-types)
 */

export {
	OVERMIND_DOMAIN,
	OVERMIND_FEATURES,
	type OvermindFeature,
} from "#lib/sys/contracts/index.js";
export { default as Canvas } from "./feature/dashboard/Canvas.svelte";
export { default as OvermindDashboard } from "./feature/dashboard/OvermindDashboard.svelte";
export { default as OvermindFrame } from "./feature/dashboard/OvermindFrame.svelte";
