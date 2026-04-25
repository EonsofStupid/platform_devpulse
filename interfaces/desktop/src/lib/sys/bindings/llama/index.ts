/**
 * @file sys/bindings/llama/index.ts
 * @description llama-server sidecar (GGUF inference child process).
 *
 * Distinct from `llama-cpp-embedded/` which is the in-process FFI build.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const startLlamaServer = commands.startLlamaServer;
export const stopLlamaServer = commands.stopLlamaServer;
export const llamaServerHealth = commands.llamaServerHealth;
export const llamaChat = commands.llamaChat;
export const llamaEmbed = commands.llamaEmbed;

export type { ChatMessage } from "$lib/sys/bindings/_shared";
export type {
	LlamaHealthStatus,
	LlamaServerInfo,
} from "$lib/sys/generated/bindings.js";
