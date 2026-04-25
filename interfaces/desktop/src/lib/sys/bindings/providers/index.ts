/**
 * @file sys/bindings/providers/index.ts
 * @description Multi-vendor AI provider validation surface.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const listProviderStatus = commands.listProviderStatus;
export const validateProvider = commands.validateProvider;
export const listProviderModels = commands.listProviderModels;

export type { CommandError, ProviderId } from "$lib/sys/bindings/_shared";
export type {
	ListModelsRequest,
	ProviderErrorKind,
	ProviderStatus,
	ValidationResult,
} from "$lib/sys/generated/bindings.js";
