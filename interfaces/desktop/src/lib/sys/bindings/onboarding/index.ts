/**
 * @file sys/bindings/onboarding/index.ts
 * @module @devpulse/sys/bindings/onboarding
 * @description First-run IPC facade — intents to the engine's onboarding
 * workflow (`systems/devpulse-engine/src/platform/onboarding/`), which checks
 * each one, writes to Turso and publishes the `onboarding` state signal.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const onboardingState = commands.onboardingState;
export const onboardingNext = commands.onboardingNext;
export const onboardingBack = commands.onboardingBack;
export const onboardingLater = commands.onboardingLater;
export const onboardingReopen = commands.onboardingReopen;

export type {
	OnboardingState,
	OnboardingStatus,
	Requirement,
	Stage,
} from "$lib/sys/generated/bindings.js";
