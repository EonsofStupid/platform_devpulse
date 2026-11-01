/**
 * @file domains/app/devpulse/index.ts
 * @module @devpulse/domains/app/devpulse
 * @description Dashboard, community, profile, settings (Nx library-types)
 */

export {
	fetchDashboardData,
	getEmptyDashboard,
	mapPayloadToDashboard,
} from "./data-access/devpulse.service.js";
export { devpulseState } from "./data-access/devpulse.state.svelte.js";
export { presentationState } from "./data-access/presentation.state.svelte.js";
export { profileSettingsState } from "./data-access/profile-settings.state.svelte.js";
export { default as DevPulseDashboard } from "./feature/dashboard/DevPulseDashboard.svelte";
export { default as PresentationSettings } from "./ui/presentation-settings/PresentationSettings.svelte";
export type {
	CommunityStats,
	DashboardData,
	RecentProject,
	UserStats,
} from "./util/devpulse.types.js";
