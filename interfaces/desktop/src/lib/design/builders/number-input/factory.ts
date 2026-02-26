/**
 * @file builders/number-input/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight NumberInput builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: role="group", aria-label
 * - Input: role="spinbutton", aria-valuenow, aria-valuemin, aria-valuemax, aria-valuetext
 * - Increment: role="button", aria-label="Increase value"
 * - Decrement: role="button", aria-label="Decrease value"
 *
 * Keyboard: ArrowUp (increment), ArrowDown (decrement), Home (min), End (max).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	kbd,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { NumberInputProps } from "./types.js";

const metadata = createBuilderMetadata("number-input", [
	"root",
	"input",
	"increment",
	"decrement",
] as const);

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

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: NumberInputProps = {} as NumberInputProps) {
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

	// --- Reactive state ---

	get value(): number {
		return this.#value.current;
	}

	set value(v: number) {
		this.#value.current = this.#clamp(v);
	}

	get disabled(): boolean {
		return this.#disabled.current;
	}

	get readOnly(): boolean {
		return this.#readonly.current;
	}

	get required(): boolean {
		return this.#required.current;
	}

	get min(): number {
		return this.#min.current;
	}

	get max(): number {
		return this.#max.current;
	}

	get step(): number {
		return this.#step.current;
	}

	get canIncrement(): boolean {
		return !this.disabled && !this.readOnly && this.value < this.max;
	}

	get canDecrement(): boolean {
		return !this.disabled && !this.readOnly && this.value > this.min;
	}

	// --- Private helpers ---

	#clamp(v: number): number {
		return Math.min(this.max, Math.max(this.min, v));
	}

	#increment(): void {
		if (!this.canIncrement) return;
		this.#value.current = this.#clamp(this.value + this.step);
	}

	#decrement(): void {
		if (!this.canDecrement) return;
		this.#value.current = this.#clamp(this.value - this.step);
	}

	// --- Slot attribute getters ---

	/** Root container attributes. Spread onto the group wrapper element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group",
			"aria-label": this.#props["aria-label"],
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/** Input element attributes. Spread onto the native <input> element. */
	get input(): SlotAttrs {
		const vt = this.#valueText.current;
		return {
			[metadata.dataAttrs.input]: "",
			id: this.ids.input,
			role: "spinbutton",
			type: "text",
			inputmode: "numeric",
			value: this.value,
			"aria-valuenow": this.value,
			"aria-valuemin": this.min === -Infinity ? undefined : this.min,
			"aria-valuemax": this.max === Infinity ? undefined : this.max,
			"aria-valuetext": vt || undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"aria-readonly": this.readOnly ? true : undefined,
			"aria-required": this.required ? true : undefined,
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

	/** Increment button attributes. Spread onto the increment button. */
	get increment(): SlotAttrs {
		const isDisabled = this.disabled || this.readOnly || !this.canIncrement;
		return {
			[metadata.dataAttrs.increment]: "",
			id: this.ids.increment,
			type: "button",
			tabindex: -1,
			"aria-label": "Increase value",
			"aria-disabled": disabledAttr(isDisabled),
			"data-disabled": dataAttr(isDisabled),

			onclick: () => {
				this.#increment();
			},
		};
	}

	/** Decrement button attributes. Spread onto the decrement button. */
	get decrement(): SlotAttrs {
		const isDisabled = this.disabled || this.readOnly || !this.canDecrement;
		return {
			[metadata.dataAttrs.decrement]: "",
			id: this.ids.decrement,
			type: "button",
			tabindex: -1,
			"aria-label": "Decrease value",
			"aria-disabled": disabledAttr(isDisabled),
			"data-disabled": dataAttr(isDisabled),

			onclick: () => {
				this.#decrement();
			},
		};
	}
}

/** Factory function — preferred API. */
export function createNumberInput(props?: NumberInputProps): NumberInput {
	return new NumberInput(props);
}
