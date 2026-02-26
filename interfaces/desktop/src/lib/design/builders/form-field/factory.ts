/**
 * @file builders/form-field/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight FormField builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Compound wrapper for label + control + description + error:
 * - Root: container div, role="group"
 * - Label: <label> with for= linking to control
 * - Control: wrapper for the actual input, aria-describedby, aria-invalid, aria-required
 * - Description: help text, linked via aria-describedby
 * - Error: error message, role="alert", aria-live="polite", linked via aria-describedby
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { FormFieldProps } from "./types.js";

const metadata = createBuilderMetadata(
	"form-field",
	["root", "label", "control", "description", "error"] as const,
);

export class FormField {
	readonly ids = metadata.createIds();
	#invalid: Synced<boolean>;
	#required: Synced<boolean>;
	#disabled: Synced<boolean>;
	#error: Synced<string | undefined>;

	constructor(props: FormFieldProps = {} as FormFieldProps) {
		this.#invalid = new Synced<boolean>({
			value: props.invalid,
			defaultValue: false,
		});

		this.#required = new Synced<boolean>({
			value: props.required,
			defaultValue: false,
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});

		this.#error = new Synced<string | undefined>({
			value: props.error,
			defaultValue: undefined,
		});
	}

	// --- Reactive state ---

	get invalid(): boolean {
		return this.#invalid.current;
	}

	get required(): boolean {
		return this.#required.current;
	}

	get disabled(): boolean {
		return this.#disabled.current;
	}

	// --- Private helpers ---

	/** Build aria-describedby value from description + error IDs. */
	#getDescribedBy(): string | undefined {
		const parts: string[] = [];
		parts.push(this.ids.description);
		if (this.invalid && this.#error.current) {
			parts.push(this.ids.error);
		}
		return parts.length > 0 ? parts.join(" ") : undefined;
	}

	// --- Slot attribute getters ---

	/** Root container attributes. Spread onto the field wrapper element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group",
			"aria-labelledby": this.ids.label,
			"data-invalid": dataAttr(this.invalid),
			"data-required": dataAttr(this.required),
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/** Label slot attributes. Spread onto the <label> element. */
	get label(): SlotAttrs {
		return {
			[metadata.dataAttrs.label]: "",
			id: this.ids.label,
			for: this.ids.control,
			"data-required": dataAttr(this.required),
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/** Control slot attributes. Spread onto the input wrapper or input element. */
	get control(): SlotAttrs {
		return {
			[metadata.dataAttrs.control]: "",
			id: this.ids.control,
			"aria-describedby": this.#getDescribedBy(),
			"aria-invalid": this.invalid ? "true" : undefined,
			"aria-required": this.required ? "true" : undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"data-invalid": dataAttr(this.invalid),
			"data-required": dataAttr(this.required),
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/** Description slot attributes. Spread onto the help text element. */
	get description(): SlotAttrs {
		return {
			[metadata.dataAttrs.description]: "",
			id: this.ids.description,
		};
	}

	/** Error slot attributes. Spread onto the error message element. */
	get error(): SlotAttrs {
		return {
			[metadata.dataAttrs.error]: "",
			id: this.ids.error,
			role: "alert",
			"aria-live": "polite",
			"data-invalid": dataAttr(this.invalid),
		};
	}
}

/** Factory function — preferred API. */
export function createFormField(props?: FormFieldProps): FormField {
	return new FormField(props);
}
