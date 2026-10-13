/**
 * @file Onboarding service — first-run intents; a refusal becomes a thrown
 * `Error` carrying Rust's message.
 * @module @devpulse/domains/app/onboarding/data-access/onboarding.service
 */

import type { Result } from "$lib/sys/bindings/_shared/index.js";
import {
	onboardingBack,
	onboardingLater,
	onboardingNext,
	onboardingReopen,
	onboardingState,
} from "$lib/sys/bindings/onboarding/index.js";
import { logError } from "$lib/sys/logger.js";
import type { OnboardingState } from "../util/onboarding.types.js";

async function unwrap(
	name: string,
	call: Promise<Result<OnboardingState, string>>,
): Promise<OnboardingState> {
	const result = await call;
	if (result.status === "error") {
		logError("onboarding.service", `${name} failed: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

export const readState = (): Promise<OnboardingState> =>
	unwrap("onboardingState", onboardingState());
export const next = (): Promise<OnboardingState> => unwrap("onboardingNext", onboardingNext());
export const back = (): Promise<OnboardingState> => unwrap("onboardingBack", onboardingBack());
export const later = (): Promise<OnboardingState> => unwrap("onboardingLater", onboardingLater());
export const reopen = (): Promise<OnboardingState> =>
	unwrap("onboardingReopen", onboardingReopen());
