/**
 * @file sys/bindings/credentials/index.ts
 * @description OS keyring credential surface (per-provider API keys).
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const storeApiKey = commands.storeApiKey;
export const getApiKey = commands.getApiKey;
export const deleteApiKey = commands.deleteApiKey;
export const getApiKeyStatus = commands.getApiKeyStatus;

export type { CommandError, ProviderId } from "$lib/sys/bindings/_shared";
export type { ApiKeyStatus } from "$lib/sys/generated/bindings.js";
