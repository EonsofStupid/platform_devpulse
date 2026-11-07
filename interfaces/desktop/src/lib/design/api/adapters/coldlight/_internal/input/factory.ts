/**
 * @file builders/input/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Input builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: implicit textbox role (native `<input>`),
 *   `aria-invalid`, `aria-required`, `aria-disabled`, `aria-readonly`
 *
 * Keyboard interaction:
 * No custom keyboard handling — native `<input>` behavior suffices.
 *
 * Data attributes:
 * | Attribute         | Values                         |
 * |-------------------|--------------------------------|
 * | `data-disabled`   | `""` (present) or absent       |
 * | `data-readonly`   | `""` (present) or absent       |
 * | `data-required`   | `""` (present) or absent       |
 * | `data-invalid`    | `""` (present) or absent       |
 * | `data-valid`      | `""` (present) or absent       |
 *
 * WAI-ARIA: Native `<input>` element provides implicit textbox role.
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
} from "../../builders/index.js";
import type { InputProps } from "./types.js";

const metadata = createBuilderMetadata("input", ["root"] as const);

/**
 * ColdLight Input builder.
 *
 * Provides a fully accessible text input with validation state support.
 * Relies on native `<input>` semantics — no custom ARIA roles needed.
 * All attributes are managed internally — consumers spread slot
 * attributes onto their `<input>` element.
 *
 * @example
 * ```ts
 * const input = createInput({ value: () => text, onValueChange: (v) => text = v });
 * ```
 */
export class Input {
	#value: Synced<string>;
	#disabled: Synced<boolean>;
	#readonly: Synced<boolean>;
	#required: Synced<boolean>;
	#invalid: Synced<boolean>;
	#type: Synced<string>;
	#props: InputProps;

	/**
	 * Unique IDs for each slot element of this input instance.
	 * Generated once at construction time via `createBuilderMetadata`.
	 */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Input builder instance.
	 *
	 * @param props - Configuration props. All are optional with sensible defaults.
	 */
	constructor(props: InputProps = {}) {
		this.#props = props;

		this.#value = new Synced<string>({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: "",
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

		this.#invalid = new Synced<boolean>({
			value: props.invalid,
			defaultValue: false,
		});

		this.#type = new Synced<string>({
			value: props.type,
			defaultValue: "text",
		});
	}

	// ======================================================================
	// Reactive State
	// ======================================================================

	/** The current input value. */
	get value(): string {
		return this.#value.current;
	}

	/** Set the input value directly. */
	set value(v: string) {
		this.#value.current = v;
	}

	/** Whether the input is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/** Whether the input is read-only. */
	get readOnly(): boolean {
		return this.#readonly.current;
	}

	/** Whether the input is required. */
	get required(): boolean {
		return this.#required.current;
	}

	/** Whether the input is in an invalid state. */
	get invalid(): boolean {
		return this.#invalid.current;
	}

	// ======================================================================
	// Slot Attribute Getters
	// ======================================================================

	/**
	 * Root element attributes.
	 *
	 * Spread onto the native `<input>` element. Provides all native
	 * attributes (`type`, `disabled`, `readonly`, `required`, `placeholder`),
	 * ARIA attributes, data attributes, and the `oninput` handler.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			type: this.#type.current,
			value: this.value,
			disabled: this.disabled || undefined,
			readonly: this.readOnly || undefined,
			required: this.required || undefined,
			placeholder: this.#props.placeholder,
			"aria-invalid": this.invalid ? (true as const) : undefined,
			"aria-required": this.required ? (true as const) : undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"aria-readonly": this.readOnly ? (true as const) : undefined,
			"aria-label": this.#props["aria-label"],
			"aria-labelledby": this.#props["aria-labelledby"],
			"aria-describedby": this.#props["aria-describedby"],
			"aria-errormessage": this.invalid ? this.#props["aria-errormessage"] : undefined,
			"data-disabled": dataAttr(this.disabled),
			"data-readonly": dataAttr(this.readOnly),
			"data-required": dataAttr(this.required),
			"data-invalid": dataAttr(this.invalid),
			"data-valid": dataAttr(!this.invalid),

			oninput: (e: Event) => {
				const target = e.target as HTMLInputElement;
				this.#value.current = target.value;
			},
		};
	}

	// ======================================================================
	// Programmatic Helpers
	// ======================================================================

	/**
	 * Focus the input element programmatically.
	 *
	 * Uses `document.getElementById` to locate the root element and
	 * call `.focus()` on it.
	 */
	focus(): void {
		const el = document.getElementById(this.ids.root);
		el?.focus();
	}

	/**
	 * Clear the input value programmatically.
	 *
	 * Resets the value to an empty string.
	 */
	clear(): void {
		this.#value.current = "";
	}
}

/**
 * Factory function for the Input builder — preferred API.
 *
 * @param props - Optional input configuration props.
 * @returns A new {@link Input} instance.
 *
 * @example
 * ```ts
 * const input = createInput({ placeholder: "Enter text..." });
 * ```
 */
export function createInput(props?: InputProps): Input {
	return new Input(props);
}
