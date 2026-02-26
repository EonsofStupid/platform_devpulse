/**
 * @file builders/input/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Input builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: implicit textbox role (native <input>),
 *   aria-invalid, aria-required, aria-disabled, aria-readonly
 *
 * No custom keyboard handling — native <input> behavior suffices.
 *
 * WAI-ARIA: Native <input> element provides implicit textbox role.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { InputProps } from "./types.js";

const metadata = createBuilderMetadata("input", ["root"] as const);

export class Input {
	#value: Synced<string>;
	#disabled: Synced<boolean>;
	#readonly: Synced<boolean>;
	#required: Synced<boolean>;
	#invalid: Synced<boolean>;
	#type: Synced<string>;
	#props: InputProps;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: InputProps = {} as InputProps) {
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

	// --- Reactive state ---

	get value(): string {
		return this.#value.current;
	}

	set value(v: string) {
		this.#value.current = v;
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

	get invalid(): boolean {
		return this.#invalid.current;
	}

	// --- Slot attribute getters ---

	/** Root element attributes. Spread onto the native <input> element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			type: this.#type.current,
			value: this.value,
			disabled: this.disabled || undefined,
			readonly: this.readOnly || undefined,
			required: this.required || undefined,
			placeholder: this.#props.placeholder,
			"aria-invalid": this.invalid ? true : undefined,
			"aria-required": this.required ? true : undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"aria-readonly": this.readOnly ? true : undefined,
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

	/** Clear the input value programmatically. */
	clear(): void {
		this.#value.current = "";
	}
}

/** Factory function — preferred API. */
export function createInput(props?: InputProps): Input {
	return new Input(props);
}
