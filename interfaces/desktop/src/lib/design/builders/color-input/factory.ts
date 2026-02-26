/**
 * @file builders/color-input/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight ColorInput builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: role="group", aria-labelledby
 * - Swatch: role="presentation" (visual indicator)
 * - Input: native <input type="color">, aria-label, aria-describedby
 * - Label: associated label element
 *
 * Keyboard: Native color picker handles Enter/Space.
 *
 * WAI-ARIA: Native <input type="color"> semantics.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { ColorInputProps } from "./types.js";

const metadata = createBuilderMetadata("color-input", [
	"root",
	"swatch",
	"input",
	"label",
] as const);

export class ColorInput {
	#value: Synced<string>;
	#disabled: Synced<boolean>;
	#required: Synced<boolean>;
	#invalid: Synced<boolean>;
	#props: ColorInputProps;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: ColorInputProps = {} as ColorInputProps) {
		this.#props = props;

		this.#value = new Synced<string>({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: "#000000",
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
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

	get required(): boolean {
		return this.#required.current;
	}

	get invalid(): boolean {
		return this.#invalid.current;
	}

	// --- Slot attribute getters ---

	/** Root container attributes. Spread onto the group wrapper element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group",
			"aria-labelledby": this.#props["aria-labelledby"] ?? this.ids.label,
			"data-disabled": dataAttr(this.disabled),
			"data-invalid": dataAttr(this.invalid),
		};
	}

	/** Swatch element attributes. Spread onto the color preview element. */
	get swatch(): SlotAttrs {
		return {
			[metadata.dataAttrs.swatch]: "",
			id: this.ids.swatch,
			role: "presentation",
			"aria-hidden": "true",
			style: `background-color: ${this.value}`,
		};
	}

	/** Input element attributes. Spread onto the native <input type="color"> element. */
	get input(): SlotAttrs {
		return {
			[metadata.dataAttrs.input]: "",
			id: this.ids.input,
			type: "color",
			value: this.value,
			disabled: this.disabled || undefined,
			required: this.required || undefined,
			"aria-label": this.#props["aria-label"] ?? "Choose color",
			"aria-describedby": this.#props["aria-describedby"],
			"aria-invalid": this.invalid ? true : undefined,
			"aria-required": this.required ? true : undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"data-disabled": dataAttr(this.disabled),
			"data-invalid": dataAttr(this.invalid),

			oninput: (e: Event) => {
				const target = e.target as HTMLInputElement;
				this.#value.current = target.value;
			},
		};
	}

	/** Label element attributes. Spread onto the label element. */
	get label(): SlotAttrs {
		return {
			[metadata.dataAttrs.label]: "",
			id: this.ids.label,
			for: this.ids.input,
		};
	}
}

/** Factory function — preferred API. */
export function createColorInput(props?: ColorInputProps): ColorInput {
	return new ColorInput(props);
}
