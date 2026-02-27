/**
 * @file builders/steps/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Steps builder.
 * Step progression pattern with `aria-current="step"` on active step.
 */

import type { MaybeGetter } from "../../builders/types.js";

/**
 * Constructor config for the Steps builder.
 *
 * All props support `MaybeGetter<T>` for controlled/uncontrolled patterns.
 */
export type StepsProps = {
	/**
	 * Current active step index (zero-based).
	 * Getter = controlled, static = uncontrolled.
	 * @default 0
	 */
	activeStep?: MaybeGetter<number | undefined>;

	/**
	 * Called when the active step changes.
	 * @param step - The new active step index.
	 */
	onActiveStepChange?: (step: number) => void;

	/**
	 * Accessible label for the steps navigation.
	 * Sets `aria-label` on the root `<nav>` element.
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * Whether navigation is restricted to completed steps only (linear mode).
	 * When `true`, users can only navigate to previously completed steps.
	 * @default true
	 */
	linear?: MaybeGetter<boolean | undefined>;

	/**
	 * Disable the entire steps component.
	 * When `true`, no step can be clicked.
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;
};
