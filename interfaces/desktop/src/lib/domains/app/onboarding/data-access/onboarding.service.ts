/**
 * @file Onboarding service — the only place first run talks to Rust: the
 * stage intents, the "You" form, the projects scan and the folder picker.
 * A failure becomes a thrown `Error` carrying Rust's message; its kind is
 * logged (plan 0001 A4).
 * @module @devpulse/domains/app/onboarding/data-access/onboarding.service
 */

import type { CommandError, Result } from "#lib/sys/bindings/_shared/index.js";
import { pickDirectory } from "#lib/sys/bindings/models/index.js";
import {
	type FormOutcome,
	type FormView,
	type FoundRepo,
	onboardingBack,
	onboardingLater,
	onboardingNext,
	onboardingRegisterProjects,
	onboardingReopen,
	onboardingScanProjects,
	onboardingState,
	onboardingYouForm,
	onboardingYouSubmit,
	type RegisterResult,
} from "#lib/sys/bindings/onboarding/index.js";
import { logError } from "#lib/sys/logger.js";
import type { OnboardingState } from "../util/onboarding.types.js";

/**
 * Rust's answer, or a thrown `Error` with its message. The first-run
 * commands answer with a `CommandError`; the folder picker still answers
 * with plain text (its module is not on `CommandError` yet).
 */
async function unwrap<T>(
	name: string,
	call: Promise<Result<T, CommandError | string>>,
): Promise<T> {
	const result = await call;
	if (result.status === "error") {
		const { error } = result;
		if (typeof error === "string") {
			logError("onboarding.service", `${name} failed: ${error}`);
			throw new Error(error);
		}
		logError("onboarding.service", `${name} failed (${error.kind}): ${error.message}`);
		throw new Error(error.message);
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

/** The "You" form: schema, your stored values, suggestions. */
export const readYouForm = (): Promise<FormView> =>
	unwrap("onboardingYouForm", onboardingYouForm());
/** Save the "You" form; refused fields come back in the outcome. */
export const submitYouForm = (values: Record<string, string | null>): Promise<FormOutcome> =>
	unwrap("onboardingYouSubmit", onboardingYouSubmit(values));

/** The repositories in a folder; `null` when the folder does not exist. */
export const scanProjects = (folder: string): Promise<FoundRepo[] | null> =>
	unwrap("onboardingScanProjects", onboardingScanProjects(folder));
/** Register the ticked repositories in place; one result per folder. */
export const registerProjects = (paths: string[]): Promise<RegisterResult[]> =>
	unwrap("onboardingRegisterProjects", onboardingRegisterProjects(paths));

/** The OS folder picker; `null` when you cancel. */
export const pickFolder = (title: string): Promise<string | null> =>
	unwrap("pickDirectory", pickDirectory(title));
