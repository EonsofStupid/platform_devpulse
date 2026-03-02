/**
 * @file sys/generated/health.types.ts
 * @description TypeScript mirrors of Rust platform health types (ts-rs).
 * Keep in sync with systems/devpulse-engine/src/platform/health.rs
 */

export type HealthStatus = "Healthy" | "Degraded" | "Down" | "Unknown";

export interface SubsystemHealth {
	name: string;
	status: HealthStatus;
	latency_ms: number | null;
	message: string | null;
}

export interface SystemHealth {
	status: HealthStatus;
	uptime_secs: number;
	subsystems: SubsystemHealth[];
}
