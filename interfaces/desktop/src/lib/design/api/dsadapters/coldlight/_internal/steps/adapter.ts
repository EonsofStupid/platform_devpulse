/**
 * @file Steps Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight Steps builder into the universal AdapterResult.
 * Steps uses getStep(index) for per-step attributes — the adapter
 * exposes the root slot directly and provides context for step resolution.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { Steps } from "./factory.svelte.js";
import type { StepsProps } from "./types.js";

/**
 * Create a Steps adapter returning the universal AdapterResult.
 *
 * @param props - Steps configuration (label, activeStep, linear, disabled)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: StepsProps): AdapterResult {
	const builder = new Steps(props);

	return {
		states: {
			disabled: {
				get current() { return builder.disabled; },
				set current(_v: boolean) { /* builder manages internally via Synced */ },
			},
		},

		attrs: {
			root: {
				get "data-cl-steps-root"() { return builder.root["data-cl-steps-root" as keyof typeof builder.root] as string; },
				get id() { return builder.ids.root; },
				get role() { return "navigation"; },
				get "aria-label"() { return builder.root["aria-label" as keyof typeof builder.root] as string | undefined; },
				get "data-disabled"() { return builder.disabled ? "" : undefined; },
			},
		},

		handlers: {
			root: {},
		},

		context: {
			getStep: (index: number, stepDisabled?: boolean) => builder.getStep(index, stepDisabled),
			next: () => builder.next(),
			prev: () => builder.prev(),
			goTo: (index: number) => builder.goTo(index),
			get activeStep() { return builder.activeStep; },
		},
	};
}
