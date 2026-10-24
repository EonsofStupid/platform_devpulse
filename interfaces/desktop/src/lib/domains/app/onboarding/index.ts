/**
 * @module @devpulse/domains/app/onboarding
 *
 * First run: Welcome → You (plan 0001 slice 1). Rust owns the workflow;
 * this domain renders the `onboarding` state and sends intents.
 */

export { onboardingState } from "./data-access/onboarding.state.svelte.js";
export { default as FirstRunFlow } from "./feature/first-run/FirstRunFlow.svelte";
export type {
	OnboardingState,
	OnboardingStatus,
	Requirement,
	Stage,
} from "./util/onboarding.types.js";
