/**
 * @file domains/app/wiredfront/index.ts
 * @module @devpulse/domains/app/wiredfront
 * @description Wiredfront — media hub (Nx library-types)
 */

export {
	WIREDFRONT_DOMAIN,
	WIREDFRONT_FEATURES,
	type WiredFrontFeature,
} from "#lib/sys/contracts/index.js";
export { default as WiredfrontDashboard } from "./feature/dashboard/WiredfrontDashboard.svelte";
