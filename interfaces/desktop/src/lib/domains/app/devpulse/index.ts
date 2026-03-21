/**
 * @file domains/app/devpulse/index.ts
 * @module @devpulse/domains/app/devpulse
 * @description Dashboard, community, profile, settings
 */

export { devpulseState } from "./runes/devpulse.runes.svelte.js";
export {
	fetchDashboardData,
	fetchProcessMetrics,
	getEmptyDashboard,
	mapPayloadToDashboard,
} from "./services/devpulse.service.js";
export type {
	CommunityStats,
	DashboardData,
	RecentProject,
	UserStats,
} from "./types/devpulse.types.js";
