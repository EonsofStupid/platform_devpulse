/**
 * @file builders/steps/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Steps builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Root: `role="navigation"`, `aria-label`.
 * Step: `aria-current="step"` on active step.
 * Tracks active step index with `Synced` for controlled/uncontrolled.
 *
 * Slots: root, step.
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	extract,
} from "../../builders/index.js";
import type { StepsProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("steps", ["root", "step"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Steps builder.
 *
 * Provides ARIA-compliant attribute objects for a multi-step progression
 * component. Supports linear and non-linear navigation, per-step disabled
 * state, and programmatic step control via `next()`, `prev()`, and `goTo()`.
 *
 * @example
 * ```ts
 * const steps = createSteps({ label: "Checkout", activeStep: 0 });
 * // <nav {...steps.root}>
 * //   <div {...steps.getStep(0)}>Cart</div>
 * //   <div {...steps.getStep(1)}>Payment</div>
 * //   <div {...steps.getStep(2)}>Confirm</div>
 * // </nav>
 * // steps.next();  // advance to step 1
 * // steps.goTo(0); // jump back to step 0
 * ```
 */
export class Steps {
	/** Unique IDs for each slot of this steps instance. */
	readonly ids: Record<"root" | "step", string> = metadata.createIds();

	/* Read-only props — $derived + extract (matches melt pattern) */
	#props!: StepsProps;
	readonly label = $derived(extract(this.#props.label, undefined as string | undefined));
	readonly linear = $derived(extract(this.#props.linear, true));
	readonly disabled = $derived(extract(this.#props.disabled, false));

	/* Read-write state — Synced (has onChange + setter) */
	#activeStep: Synced<number>;

	/**
	 * Create a new Steps builder instance.
	 * @param props - Configuration options for the steps component.
	 */
	constructor(props: StepsProps = {}) {
		this.#props = props;

		this.#activeStep = new Synced<number>({
			value: props.activeStep,
			onChange: props.onActiveStepChange,
			defaultValue: 0,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** The current active step index (zero-based). */
	get activeStep(): number {
		return this.#activeStep.current;
	}

	/** Set the active step index. */
	set activeStep(value: number) {
		this.#activeStep.current = value;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/** Root container attributes. Spread onto the steps navigation wrapper (`<nav>`). */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "navigation" as const,
			"aria-label": this.label,
			"data-disabled": dataAttr(this.disabled),
		};
	}

	// ========================================================================
	// Helper methods
	// ========================================================================

	/**
	 * Get attributes for an individual step element.
	 *
	 * Computes `data-state` (`"active"` | `"completed"` | `"upcoming"`),
	 * `aria-current="step"` for the active step, and click handler
	 * for navigation.
	 *
	 * @param index - Zero-based step index.
	 * @param stepDisabled - Override disabled state for this specific step.
	 * @returns Attribute object to spread onto the step element.
	 */
	getStep(index: number, stepDisabled?: boolean) {
		const isActive = this.activeStep === index;
		const isCompleted = this.activeStep > index;
		const isDisabled = this.disabled || (stepDisabled ?? false);
		const canNavigate = !this.linear || isCompleted;

		return {
			[metadata.dataAttrs.step]: "" as const,
			id: `${this.ids.step}-${index}`,
			"data-step": index,
			"data-state": isActive ? ("active" as const) : isCompleted ? ("completed" as const) : ("upcoming" as const),
			"data-disabled": dataAttr(isDisabled),
			"aria-current": isActive ? ("step" as const) : undefined,
			"aria-disabled": disabledAttr(isDisabled || (!canNavigate && !isActive)),

			onclick: () => {
				if (isDisabled) return;
				if (this.linear && !isCompleted && !isActive) return;
				this.#activeStep.current = index;
			},
		};
	}

	/**
	 * Advance to the next step.
	 * Does not enforce bounds — caller is responsible for step count.
	 */
	next(): void {
		this.#activeStep.current = this.activeStep + 1;
	}

	/**
	 * Go back to the previous step.
	 * Will not go below step 0.
	 */
	prev(): void {
		if (this.activeStep > 0) {
			this.#activeStep.current = this.activeStep - 1;
		}
	}

	/**
	 * Go to a specific step by index.
	 * @param index - The zero-based step index to navigate to.
	 */
	goTo(index: number): void {
		this.#activeStep.current = index;
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for creating a Steps builder — preferred API.
 * @param props - Configuration options for the steps component.
 * @returns A new `Steps` builder instance.
 */
export function createSteps(props?: StepsProps): Steps {
	return new Steps(props);
}
