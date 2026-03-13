/**
 * @file sys/generated/boot.types.ts
 * @description TypeScript mirrors of Rust boot state types.
 * Keep in sync with interfaces/desktop/src-tauri/src/state.rs
 */

import type { InitEvent } from "./init.types.js";
import type { SystemHealth } from "./health.types.js";

/** Boot phase — matches Rust BootPhase enum (PascalCase serde). */
export type BootPhase = "Initializing" | "Ready" | "Failed";

/** Snapshot of accumulated boot state — returned by get_boot_state command. */
export interface BootSnapshot {
	phase: BootPhase;
	events: InitEvent[];
	health: SystemHealth | null;
	error: string | null;
}
