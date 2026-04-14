/**
 * @file domains/app/devpulse/index.ts
 * @module @devpulse/domains/app/devpulse
 * @description Dashboard, community, profile, settings (Nx library-types)
 */

export {
	fetchDashboardData,
	fetchProcessMetrics,
	getEmptyDashboard,
	mapPayloadToDashboard,
} from "./data-access/devpulse.service.js";
export { devpulseState } from "./data-access/devpulse.state.svelte.js";
export type {
	CommunityStats,
	DashboardData,
	RecentProject,
	UserStats,
} from "./util/devpulse.types.js";
