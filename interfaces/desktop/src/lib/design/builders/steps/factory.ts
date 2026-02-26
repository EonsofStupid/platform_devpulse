/**
 * @file builders/steps/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Steps builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Root: role="navigation", aria-label.
 * Step: aria-current="step" on active step.
 * Tracks active step index with Synced for controlled/uncontrolled.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { StepsProps } from "./types.js";

const metadata = createBuilderMetadata("steps", ["root", "step"] as const);

export class Steps {
	readonly ids = metadata.createIds();
	#activeStep: Synced<number>;
	#label: Synced<string | undefined>;
	#linear: Synced<boolean>;
	#disabled: Synced<boolean>;

	constructor(props: StepsProps = {} as StepsProps) {
		this.#activeStep = new Synced<number>({
			value: props.activeStep,
			onChange: props.onActiveStepChange,
			defaultValue: 0,
		});

		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});

		this.#linear = new Synced<boolean>({
			value: props.linear,
			defaultValue: true,
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});
	}

	// --- Reactive state ---

	get activeStep(): number {
		return this.#activeStep.current;
	}

	set activeStep(value: number) {
		this.#activeStep.current = value;
	}

	get disabled(): boolean {
		return this.#disabled.current;
	}

	get linear(): boolean {
		return this.#linear.current;
	}

	// --- Slot attribute getters ---

	/** Root container attributes. Spread onto the steps navigation wrapper. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "navigation",
			"aria-label": this.#label.current,
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Get attributes for an individual step.
	 * @param index — zero-based step index
	 * @param stepDisabled — override disabled for this specific step
	 */
	getStep(index: number, stepDisabled?: boolean): SlotAttrs {
		const isActive = this.activeStep === index;
		const isCompleted = this.activeStep > index;
		const isDisabled = this.disabled || (stepDisabled ?? false);
		const canNavigate = !this.linear || isCompleted;

		return {
			[metadata.dataAttrs.step]: "",
			id: `${this.ids.step}-${index}`,
			"data-step": index,
			"data-state": isActive ? "active" : isCompleted ? "completed" : "upcoming",
			"data-disabled": dataAttr(isDisabled),
			"aria-current": isActive ? "step" : undefined,
			"aria-disabled": disabledAttr(isDisabled || (!canNavigate && !isActive)),

			onclick: () => {
				if (isDisabled) return;
				if (this.linear && !isCompleted && !isActive) return;
				this.#activeStep.current = index;
			},
		};
	}

	// --- Navigation helpers ---

	/** Advance to the next step. */
	next(): void {
		this.#activeStep.current = this.activeStep + 1;
	}

	/** Go back to the previous step. */
	prev(): void {
		if (this.activeStep > 0) {
			this.#activeStep.current = this.activeStep - 1;
		}
	}

	/** Go to a specific step by index. */
	goTo(index: number): void {
		this.#activeStep.current = index;
	}
}

/** Factory function — preferred API. */
export function createSteps(props?: StepsProps): Steps {
	return new Steps(props);
}
