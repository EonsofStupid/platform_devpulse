/**
 * @file sys/bindings/llama-cpp-embedded/index.ts
 * @description llama.cpp FFI build (embedded, in-process) — config only.
 *
 * Distinct from `llama/` which is the llama-server child-process surface.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const llamaCppEmbeddedLoadConfig = commands.llamaCppEmbeddedLoadConfig;
export const llamaCppEmbeddedSaveConfig = commands.llamaCppEmbeddedSaveConfig;

export type {
	LlamaCppEmbeddedConfig,
	OffloadConfig,
} from "$lib/sys/generated/bindings.js";
