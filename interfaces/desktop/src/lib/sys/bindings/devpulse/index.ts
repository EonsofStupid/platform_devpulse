/**
 * @file sys/bindings/devpulse/index.ts
 * @description Top-level DevPulse dashboard + user profile/preferences.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const fetchDashboard = commands.fetchDashboard;
export const fetchUserProfile = commands.fetchUserProfile;
export const updateUserProfile = commands.updateUserProfile;
export const fetchUserPreferences = commands.fetchUserPreferences;
export const updateUserPreferences = commands.updateUserPreferences;

export type {
	DailyStatsRow,
	DashboardPayload,
	MessageStats,
	UserPreferences,
	UserProfile,
} from "$lib/sys/generated/bindings.js";
