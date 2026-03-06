/**
 * @file sys/generated/init.types.ts
 * @description TypeScript mirrors of Rust platform init types (ts-rs).
 * Keep in sync with systems/devpulse-engine/src/platform/init.rs
 */

export type InitStatus = "Running" | "Ok" | "Error" | "Skipped";

export interface InitEvent {
	/** Step name (public-safe, ip_term!() already applied in Rust). */
	step: string;
	/** Current status of this step. */
	status: InitStatus;
	/** Human-readable message. */
	message: string | null;
	/** How long this step took (populated on completion). */
	latency_ms: number | null;
}
