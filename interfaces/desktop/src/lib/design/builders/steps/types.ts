/**
 * @file builders/steps/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Steps builder.
 * Step progression pattern with aria-current="step" on active step.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Steps. MaybeGetter for controlled/uncontrolled. */
export type StepsProps = {
	/** Current active step index (zero-based). Getter = controlled, static = uncontrolled. @default 0 */
	activeStep?: MaybeGetter<number | undefined>;
	/** Called when active step changes. */
	onActiveStepChange?: (step: number) => void;
	/** Accessible label for the steps navigation. */
	label?: MaybeGetter<string | undefined>;
	/** Whether navigation to completed steps is allowed. @default true */
	linear?: MaybeGetter<boolean | undefined>;
	/** Disable the entire steps component. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
};
