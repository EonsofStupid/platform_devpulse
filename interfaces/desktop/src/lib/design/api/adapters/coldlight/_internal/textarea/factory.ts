/**
 * @file builders/textarea/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Textarea builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: implicit textbox role (native `<textarea>`), `aria-multiline="true"`,
 *   `aria-invalid`, `aria-required`, `aria-disabled`, `aria-readonly`
 *
 * Keyboard interaction:
 * No custom keyboard handling — native `<textarea>` behavior suffices.
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
 * WAI-ARIA: Native `<textarea>` provides implicit textbox role with `aria-multiline`.
 */

import { Synced } from "../../../../../builders/_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
} from "../../../../../builders/_internal/index.js";
import type { TextareaProps } from "./types.js";

const metadata = createBuilderMetadata("textarea", ["root"] as const);

/**
 * ColdLight Textarea builder.
 *
 * Provides a fully accessible multiline text input with validation state
 * support. Relies on native `<textarea>` semantics with `aria-multiline`.
 * All attributes are managed internally — consumers spread slot
 * attributes onto their `<textarea>` element.
 *
 * @example
 * ```ts
 * const textarea = createTextarea({ value: () => text, rows: 5 });
 * ```
 */
export class Textarea {
	#value: Synced<string>;
	#disabled: Synced<boolean>;
	#readonly: Synced<boolean>;
	#required: Synced<boolean>;
	#invalid: Synced<boolean>;
	#rows: Synced<number>;
	#props: TextareaProps;

	/**
	 * Unique IDs for each slot element of this textarea instance.
	 * Generated once at construction time via `createBuilderMetadata`.
	 */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Textarea builder instance.
	 *
	 * @param props - Configuration props. All are optional with sensible defaults.
	 */
	constructor(props: TextareaProps = {}) {
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

		this.#rows = new Synced<number>({
			value: props.rows,
			defaultValue: 3,
		});
	}

	// ======================================================================
	// Reactive State
	// ======================================================================

	/** The current textarea value. */
	get value(): string {
		return this.#value.current;
	}

	/** Set the textarea value directly. */
	set value(v: string) {
		this.#value.current = v;
	}

	/** Whether the textarea is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/** Whether the textarea is read-only. */
	get readOnly(): boolean {
		return this.#readonly.current;
	}

	/** Whether the textarea is required. */
	get required(): boolean {
		return this.#required.current;
	}

	/** Whether the textarea is in an invalid state. */
	get invalid(): boolean {
		return this.#invalid.current;
	}

	// ======================================================================
	// Slot Attribute Getters
	// ======================================================================

	/**
	 * Root element attributes.
	 *
	 * Spread onto the native `<textarea>` element. Provides all native
	 * attributes (`rows`, `disabled`, `readonly`, `required`, `placeholder`),
	 * ARIA attributes including `aria-multiline="true"`, data attributes,
	 * and the `oninput` handler.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			value: this.value,
			rows: this.#rows.current,
			disabled: this.disabled || undefined,
			readonly: this.readOnly || undefined,
			required: this.required || undefined,
			placeholder: this.#props.placeholder,
			"aria-multiline": "true" as const,
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
				const target = e.target as HTMLTextAreaElement;
				this.#value.current = target.value;
			},
		};
	}

	// ======================================================================
	// Programmatic Helpers
	// ======================================================================

	/**
	 * Focus the textarea element programmatically.
	 *
	 * Uses `document.getElementById` to locate the root element and
	 * call `.focus()` on it.
	 */
	focus(): void {
		const el = document.getElementById(this.ids.root);
		el?.focus();
	}

	/**
	 * Clear the textarea value programmatically.
	 *
	 * Resets the value to an empty string.
	 */
	clear(): void {
		this.#value.current = "";
	}
}

/**
 * Factory function for the Textarea builder — preferred API.
 *
 * @param props - Optional textarea configuration props.
 * @returns A new {@link Textarea} instance.
 *
 * @example
 * ```ts
 * const textarea = createTextarea({ rows: 5, placeholder: "Type here..." });
 * ```
 */
export function createTextarea(props?: TextareaProps): Textarea {
	return new Textarea(props);
}
