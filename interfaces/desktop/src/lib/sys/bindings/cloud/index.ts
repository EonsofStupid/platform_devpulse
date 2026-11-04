/**
 * @file sys/bindings/cloud/index.ts
 * @description Cloud inference (Anthropic API) — provider toggle + chat.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const getInferenceProvider = commands.getInferenceProvider;
export const setInferenceProvider = commands.setInferenceProvider;
export const cloudReady = commands.cloudReady;
export const cloudChat = commands.cloudChat;

export type {
	CloudChatResult,
	CloudMessage,
	InferenceProvider,
} from "#lib/sys/generated/bindings.js";
