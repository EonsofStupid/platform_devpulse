/**
 * @file DevPulse Domain Types
 * @module @devpulse/domains/app/devpulse/types
 */

export interface UserStats {
	readonly totalProjects: number;
	readonly totalCommits: number;
	readonly activeBranches: number;
	readonly streak: number;
	readonly lastActivity: string;
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
	readonly branch: string;
}

export interface DashboardData {
	readonly user: UserStats;
	readonly community: CommunityStats;
	readonly recentProjects: readonly RecentProject[];
}
