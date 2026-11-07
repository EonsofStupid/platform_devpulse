/**
 * @file builders/number-input/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight NumberInput builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: `role="group"`, `aria-label`
 * - Input: `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`,
 *   `aria-valuemax`, `aria-valuetext`
 * - Increment: `type="button"`, `aria-label="Increase value"`
 * - Decrement: `type="button"`, `aria-label="Decrease value"`
 *
 * Keyboard interaction:
 * | Key       | Action                                    |
 * |-----------|-------------------------------------------|
 * | ArrowUp   | Increment value by step                   |
 * | ArrowDown | Decrement value by step                   |
 * | Home      | Set value to minimum (if finite)          |
 * | End       | Set value to maximum (if finite)          |
 *
 * Data attributes:
 * | Attribute        | Values                         |
 * |------------------|--------------------------------|
 * | `data-disabled`  | `""` (present) or absent       |
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	kbd,
} from "../../builders/index.js";
import type { NumberInputProps } from "./types.js";

const metadata = createBuilderMetadata("number-input", [
	"root",
	"input",
	"increment",
	"decrement",
] as const);

/**
 * ColdLight NumberInput builder.
 *
 * Provides a fully accessible numeric spinbutton widget with increment
 * and decrement controls, min/max clamping, and step support. All ARIA
 * semantics are managed internally — consumers spread slot attributes
 * onto their elements.
 *
 * @example
 * ```ts
 * const num = createNumberInput({ value: () => count, min: 0, max: 100, step: 5 });
 * ```
 */
export class NumberInput {
	#value: Synced<number>;
	#min: Synced<number>;
	#max: Synced<number>;
	#step: Synced<number>;
	#disabled: Synced<boolean>;
	#readonly: Synced<boolean>;
	#required: Synced<boolean>;
	#valueText: Synced<string>;
	#props: NumberInputProps;

	/**
	 * Unique IDs for each slot element of this number-input instance.
	 * Generated once at construction time via `createBuilderMetadata`.
	 */
	readonly ids: { readonly root: string; readonly input: string; readonly increment: string; readonly decrement: string } = metadata.createIds();

	/**
	 * Create a new NumberInput builder instance.
	 *
	 * @param props - Configuration props. All are optional with sensible defaults.
	 */
	constructor(props: NumberInputProps = {}) {
		this.#props = props;

		this.#value = new Synced<number>({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: 0,
		});

		this.#min = new Synced<number>({
			value: props.min,
			defaultValue: -Infinity,
		});

		this.#max = new Synced<number>({
			value: props.max,
			defaultValue: Infinity,
		});

		this.#step = new Synced<number>({
			value: props.step,
			defaultValue: 1,
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});

		this.#readonly = new Synced<boolean>({
			value: props.readonly,
			defaultValue: false,
		});

		this.#required = new Synced<boolean>({
			value: props.required,
			defaultValue: false,
		});

		this.#valueText = new Synced<string>({
			value: props.valueText,
			defaultValue: "",
		});
	}

	// ======================================================================
	// Reactive State
	// ======================================================================

	/** The current numeric value, clamped to min/max bounds. */
	get value(): number {
		return this.#value.current;
	}

	/** Set the numeric value directly. The value is clamped to min/max bounds. */
	set value(v: number) {
		this.#value.current = this.#clamp(v);
	}

	/** Whether the number input is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/** Whether the number input is read-only. */
	get readOnly(): boolean {
		return this.#readonly.current;
	}

	/** Whether the number input is required. */
	get required(): boolean {
		return this.#required.current;
	}

	/** The minimum allowed value. */
	get min(): number {
		return this.#min.current;
	}

	/** The maximum allowed value. */
	get max(): number {
		return this.#max.current;
	}

	/** The step increment value. */
	get step(): number {
		return this.#step.current;
	}

	/** Whether the value can be incremented (not disabled, not read-only, below max). */
	get canIncrement(): boolean {
		return !this.disabled && !this.readOnly && this.value < this.max;
	}

	/** Whether the value can be decremented (not disabled, not read-only, above min). */
	get canDecrement(): boolean {
		return !this.disabled && !this.readOnly && this.value > this.min;
	}

	// ======================================================================
	// Private
	// ======================================================================

	/** Clamp a value to the min/max bounds. */
	#clamp(v: number): number {
		return Math.min(this.max, Math.max(this.min, v));
	}

	/** Increment the value by one step, respecting bounds. */
	#increment(): void {
		if (!this.canIncrement) return;
		this.#value.current = this.#clamp(this.value + this.step);
	}

	/** Decrement the value by one step, respecting bounds. */
	#decrement(): void {
		if (!this.canDecrement) return;
		this.#value.current = this.#clamp(this.value - this.step);
	}

	// ======================================================================
	// Slot Attribute Getters
	// ======================================================================

	/**
	 * Root container attributes.
	 *
	 * Spread onto the group wrapper element. Provides `role="group"`
	 * and the accessible label for the entire number input composite.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group" as const,
			"aria-label": this.#props["aria-label"],
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Input element attributes.
	 *
	 * Spread onto the native `<input>` element. Provides `role="spinbutton"`,
	 * `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, keyboard handling
	 * (ArrowUp, ArrowDown, Home, End), and the `oninput` handler.
	 */
	get input() {
		const vt = this.#valueText.current;
		return {
			[metadata.dataAttrs.input]: "",
			id: this.ids.input,
			role: "spinbutton" as const,
			type: "text" as const,
			inputmode: "numeric" as const,
			value: this.value,
			"aria-valuenow": this.value,
			"aria-valuemin": this.min === -Infinity ? undefined : this.min,
			"aria-valuemax": this.max === Infinity ? undefined : this.max,
			"aria-valuetext": vt || undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"aria-readonly": this.readOnly ? (true as const) : undefined,
			"aria-required": this.required ? (true as const) : undefined,
			"aria-describedby": this.#props["aria-describedby"],
			disabled: this.disabled || undefined,
			readonly: this.readOnly || undefined,
			"data-disabled": dataAttr(this.disabled),

			oninput: (e: Event) => {
				if (this.readOnly) return;
				const target = e.target as HTMLInputElement;
				const parsed = parseFloat(target.value);
				if (!Number.isNaN(parsed)) {
					this.#value.current = this.#clamp(parsed);
				}
			},

			onkeydown: (e: KeyboardEvent) => {
				if (this.disabled || this.readOnly) return;

				if (e.key === kbd.ARROW_UP) {
					e.preventDefault();
					this.#increment();
				} else if (e.key === kbd.ARROW_DOWN) {
					e.preventDefault();
					this.#decrement();
				} else if (e.key === kbd.HOME) {
					e.preventDefault();
					if (this.min !== -Infinity) {
						this.#value.current = this.min;
					}
				} else if (e.key === kbd.END) {
					e.preventDefault();
					if (this.max !== Infinity) {
						this.#value.current = this.max;
					}
				}
			},
		};
	}

	/**
	 * Increment button attributes.
	 *
	 * Spread onto the increment button. Includes `aria-label="Increase value"`
	 * and disables itself when the value is at or above the maximum.
	 */
	get increment() {
		const isDisabled = this.disabled || this.readOnly || !this.canIncrement;
		return {
			[metadata.dataAttrs.increment]: "",
			id: this.ids.increment,
			type: "button" as const,
			tabindex: -1 as const,
			"aria-label": "Increase value" as const,
			"aria-disabled": disabledAttr(isDisabled),
			"data-disabled": dataAttr(isDisabled),

			onclick: () => {
				this.#increment();
			},
		};
	}

	/**
	 * Decrement button attributes.
	 *
	 * Spread onto the decrement button. Includes `aria-label="Decrease value"`
	 * and disables itself when the value is at or below the minimum.
	 */
	get decrement() {
		const isDisabled = this.disabled || this.readOnly || !this.canDecrement;
		return {
			[metadata.dataAttrs.decrement]: "",
			id: this.ids.decrement,
			type: "button" as const,
			tabindex: -1 as const,
			"aria-label": "Decrease value" as const,
			"aria-disabled": disabledAttr(isDisabled),
			"data-disabled": dataAttr(isDisabled),

			onclick: () => {
				this.#decrement();
			},
		};
	}

	// ======================================================================
	// Programmatic Helpers
	// ======================================================================

	/**
	 * Increment the value by one step programmatically.
	 *
	 * Respects min/max bounds. No-op if disabled, read-only, or
	 * already at the maximum.
	 */
	incrementValue(): void {
		this.#increment();
	}

	/**
	 * Decrement the value by one step programmatically.
	 *
	 * Respects min/max bounds. No-op if disabled, read-only, or
	 * already at the minimum.
	 */
	decrementValue(): void {
		this.#decrement();
	}
}

/**
 * Factory function for the NumberInput builder — preferred API.
 *
 * @param props - Optional number input configuration props.
 * @returns A new {@link NumberInput} instance.
 *
 * @example
 * ```ts
 * const num = createNumberInput({ min: 0, max: 100, step: 5 });
 * ```
 */
export function createNumberInput(props?: NumberInputProps): NumberInput {
	return new NumberInput(props);
}
