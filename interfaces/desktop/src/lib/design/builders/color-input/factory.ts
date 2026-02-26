/**
 * @file builders/color-input/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight ColorInput builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: `role="group"`, `aria-labelledby`
 * - Swatch: `role="presentation"`, `aria-hidden="true"` (visual color preview)
 * - Input: native `<input type="color">`, `aria-label`, `aria-describedby`
 * - Label: associated label element via `for` attribute
 *
 * Keyboard interaction:
 * Native color picker handles Enter/Space to open the picker dialog.
 *
 * Data attributes:
 * | Attribute        | Values                         |
 * |------------------|--------------------------------|
 * | `data-disabled`  | `""` (present) or absent       |
 * | `data-invalid`   | `""` (present) or absent       |
 *
 * WAI-ARIA: Native `<input type="color">` semantics.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
} from "../_internal/index.js";
import type { ColorInputProps } from "./types.js";

const metadata = createBuilderMetadata("color-input", [
	"root",
	"swatch",
	"input",
	"label",
] as const);

/**
 * ColdLight ColorInput builder.
 *
 * Provides a fully accessible color picker input with a visual swatch
 * preview and label association. Relies on native `<input type="color">`
 * semantics. All ARIA attributes are managed internally — consumers
 * spread slot attributes onto their elements.
 *
 * @example
 * ```ts
 * const color = createColorInput({ value: () => hex, onValueChange: (v) => hex = v });
 * ```
 */
export class ColorInput {
	#value: Synced<string>;
	#disabled: Synced<boolean>;
	#required: Synced<boolean>;
	#invalid: Synced<boolean>;
	#props: ColorInputProps;

	/**
	 * Unique IDs for each slot element of this color-input instance.
	 * Generated once at construction time via `createBuilderMetadata`.
	 */
	readonly ids: { readonly root: string; readonly swatch: string; readonly input: string; readonly label: string } = metadata.createIds();

	/**
	 * Create a new ColorInput builder instance.
	 *
	 * @param props - Configuration props. All are optional with sensible defaults.
	 */
	constructor(props: ColorInputProps = {}) {
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

	// ======================================================================
	// Reactive State
	// ======================================================================

	/** The current color value as a hex string (e.g., `"#ff0000"`). */
	get value(): string {
		return this.#value.current;
	}

	/** Set the color value directly. Expected format: hex string (e.g., `"#ff0000"`). */
	set value(v: string) {
		this.#value.current = v;
	}

	/** Whether the color input is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/** Whether the color input is required. */
	get required(): boolean {
		return this.#required.current;
	}

	/** Whether the color input is in an invalid state. */
	get invalid(): boolean {
		return this.#invalid.current;
	}

	// ======================================================================
	// Slot Attribute Getters
	// ======================================================================

	/**
	 * Root container attributes.
	 *
	 * Spread onto the group wrapper element. Provides `role="group"`
	 * and associates the group with its label via `aria-labelledby`.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group" as const,
			"aria-labelledby": this.#props["aria-labelledby"] ?? this.ids.label,
			"data-disabled": dataAttr(this.disabled),
			"data-invalid": dataAttr(this.invalid),
		};
	}

	/**
	 * Swatch element attributes.
	 *
	 * Spread onto the color preview element. Marked as `role="presentation"`
	 * and `aria-hidden="true"` since it is purely visual. Includes an
	 * inline `background-color` style reflecting the current value.
	 */
	get swatch() {
		return {
			[metadata.dataAttrs.swatch]: "",
			id: this.ids.swatch,
			role: "presentation" as const,
			"aria-hidden": "true" as const,
			style: `background-color: ${this.value}`,
		};
	}

	/**
	 * Input element attributes.
	 *
	 * Spread onto the native `<input type="color">` element. Provides
	 * the color type, value binding, ARIA attributes, and the `oninput`
	 * handler for updating the value on user interaction.
	 */
	get input() {
		return {
			[metadata.dataAttrs.input]: "",
			id: this.ids.input,
			type: "color" as const,
			value: this.value,
			disabled: this.disabled || undefined,
			required: this.required || undefined,
			"aria-label": this.#props["aria-label"] ?? ("Choose color" as const),
			"aria-describedby": this.#props["aria-describedby"],
			"aria-invalid": this.invalid ? (true as const) : undefined,
			"aria-required": this.required ? (true as const) : undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"data-disabled": dataAttr(this.disabled),
			"data-invalid": dataAttr(this.invalid),

			oninput: (e: Event) => {
				const target = e.target as HTMLInputElement;
				this.#value.current = target.value;
			},
		};
	}

	/**
	 * Label element attributes.
	 *
	 * Spread onto the label element. Associates the label with the
	 * color input via the `for` attribute pointing to the input's ID.
	 */
	get label() {
		return {
			[metadata.dataAttrs.label]: "",
			id: this.ids.label,
			for: this.ids.input,
		};
	}
}

/**
 * Factory function for the ColorInput builder — preferred API.
 *
 * @param props - Optional color input configuration props.
 * @returns A new {@link ColorInput} instance.
 *
 * @example
 * ```ts
 * const color = createColorInput({ value: "#ff0000" });
 * ```
 */
export function createColorInput(props?: ColorInputProps): ColorInput {
	return new ColorInput(props);
}
