/**
 * @file sys/bindings/providers/index.ts
 * @description Your AI providers: the `providers` state the engine publishes
 * (installed, version, signed in, the action running) and its intents, plus
 * the older multi-vendor validation surface.
 */

import { commands } from "$lib/sys/generated/bindings.js";

// ── Your AI (plan 0001 R11) ──────────────────────────────────────
export const providersState = commands.providersState;
export const providersCheck = commands.providersCheck;
export const providersRunAction = commands.providersRunAction;

// ── Validation (API-key vendors) ─────────────────────────────────
export const listProviderStatus = commands.listProviderStatus;
export const validateProvider = commands.validateProvider;
export const listProviderModels = commands.listProviderModels;

export type { CommandError, ProviderId } from "$lib/sys/bindings/_shared";
export type {
	ListModelsRequest,
	ProviderAction,
	ProviderActionRun,
	ProviderReport,
	ProviderStatus,
	ProvidersState,
	ValidationResult,
} from "$lib/sys/generated/bindings.js";
