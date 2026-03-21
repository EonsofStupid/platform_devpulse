/**
 * @file sys/generated/health.types.ts
 * @description TypeScript mirrors of Rust platform health types (ts-rs).
 * Keep in sync with systems/devpulse-engine/src/platform/health.rs
 */

export type HealthStatus = "Healthy" | "Degraded" | "Down" | "Unknown";

export type ServiceState = "Created" | "Booting" | "Ready" | "Degraded" | "Failed";

export interface SubsystemHealth {
	name: string;
	/** Lifecycle state — Created, Booting, Ready, Degraded, or Failed. */
	state: ServiceState;
	/** Ping result — Healthy if ping succeeded, Down if it failed. */
	status: HealthStatus;
	/** Ping latency in microseconds. Prevents sub-ms operations from reporting 0. */
	latency_us: number | null;
	message: string | null;
}

export interface SystemHealth {
	status: HealthStatus;
	uptime_secs: number;
	subsystems: SubsystemHealth[];
}
