/**
 * @file sys/bindings/_shared/index.ts
 * @module @devpulse/sys/bindings/_shared
 * @description Shared bindings primitives that cross every domain.
 *
 * These are tauri-specta types that two or more domain facades need
 * to reference. Keeping the canonical re-export here avoids ad-hoc
 * cross-domain `import` paths between facade folders.
 */

export type {
	ChatMessage,
	CommandError,
	ProviderId,
	Result,
} from "$lib/sys/generated/bindings.js";
