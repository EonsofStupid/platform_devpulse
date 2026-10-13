/**
 * @file sys/bindings/copy/index.ts
 * @module @devpulse/sys/bindings/copy
 * @description UI copy catalog facade (`systems/devpulse-engine/src/platform/copy/`).
 * Available before the platform finishes booting.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const getCopy = commands.getCopy;

export type {
	CopyCatalog,
	LoadedCopy,
	OnboardingCommonCopy,
	OnboardingCopy,
	WelcomeCopy,
} from "$lib/sys/generated/bindings.js";
