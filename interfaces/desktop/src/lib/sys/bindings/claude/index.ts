/**
 * @file sys/bindings/claude/index.ts
 * @description Claude install detection + DevPulse-MCP registration.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const getMcpStatus = commands.getMcpStatus;
export const detectClaudeInstalls = commands.detectClaudeInstalls;
export const registerDevpulseMcp = commands.registerDevpulseMcp;
export const unregisterDevpulseMcp = commands.unregisterDevpulseMcp;

export type { CommandError } from "#lib/sys/bindings/_shared/index.js";
export type {
	ClaudeInstall,
	ClaudeInstalls,
	ClaudeTarget,
	McpStatus,
} from "#lib/sys/generated/bindings.js";
