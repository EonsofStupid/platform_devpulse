/**
 * @file DevPulse Domain Types
 * @module @devpulse/domains/app/devpulse/types
 *
 * Every field is a real value read from a store, labelled as what it is.
 * Live system load (CPU, RAM, GPU) is not here — it is Rust-owned hardware
 * state read from `hardwareState`. Git-derived stats (commits, branches)
 * arrive with the developer profile (plan 0004 Part C).
 */

export interface UserStats {
	/** Projects registered in DevPulse. */
	readonly totalProjects: number;
	/** Chat messages stored. */
	readonly totalMessages: number;
	/** Chat sessions stored. */
	readonly totalSessions: number;
	/** How long the platform has been running, formatted. */
	readonly uptime: string;
}

export interface CommunityStats {
	readonly friends: number;
	readonly groups: number;
	readonly contributions: number;
}

export interface RecentProject {
	readonly id: string;
	readonly name: string;
	readonly language: string;
	readonly lastModified: string;
}

export interface TimeSeriesData {
	readonly label: string;
	readonly data: readonly number[];
}

/** Per-day history from the analytics store (oldest first). */
export interface ActivityHistory {
	/** Signals + messages per day. */
	readonly activityTimeline: TimeSeriesData;
	/** Messages per day. */
	readonly messageHistory: TimeSeriesData;
	/** Average response latency per day, in milliseconds. */
	readonly latencyHistory: TimeSeriesData;
}

export interface DashboardData {
	readonly user: UserStats;
	readonly community: CommunityStats;
	readonly recentProjects: readonly RecentProject[];
	readonly history: ActivityHistory;
}
