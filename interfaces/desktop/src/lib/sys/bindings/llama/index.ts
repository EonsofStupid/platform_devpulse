/**
 * @file sys/bindings/llama/index.ts
 * @description llama-server sidecar (GGUF inference child process) and
 * your llama-server settings, which a GGUF slot load starts it with.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const startLlamaServer = commands.startLlamaServer;
export const stopLlamaServer = commands.stopLlamaServer;
export const llamaServerHealth = commands.llamaServerHealth;
export const llamaChat = commands.llamaChat;
export const llamaEmbed = commands.llamaEmbed;
export const llamaServerLoadConfig = commands.llamaServerLoadConfig;
export const llamaServerSaveConfig = commands.llamaServerSaveConfig;

export type { ChatMessage } from "#lib/sys/bindings/_shared/index.js";
export type {
	LlamaHealthStatus,
	LlamaServerConfig,
	LlamaServerInfo,
	OffloadConfig,
} from "#lib/sys/generated/bindings.js";
