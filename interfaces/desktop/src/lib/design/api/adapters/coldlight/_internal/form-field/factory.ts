/**
 * @file builders/form-field/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight FormField builder — Svelte 5 runes-native.
 *
 * The FormField builder owns all ARIA semantics and data-attribute derivation
 * for the compound form field pattern. Components create a FormField instance
 * and spread the slot getters onto the respective elements: root, label,
 * control, description, and error.
 *
 * ## ARIA Semantics
 *
 * - Root: `role="group"`, `aria-labelledby` (linked to label)
 * - Label: `<label>` with `for=` linking to control
 * - Control: `aria-describedby` (description + error), `aria-invalid`, `aria-required`
 * - Description: help text linked via `aria-describedby`
 * - Error: `role="alert"`, `aria-live="polite"`, linked via `aria-describedby`
 *
 * ## Data Attributes
 *
 * - `data-cl-form-field-root` — builder identity (root)
 * - `data-cl-form-field-label` — builder identity (label)
 * - `data-cl-form-field-control` — builder identity (control)
 * - `data-cl-form-field-description` — builder identity (description)
 * - `data-cl-form-field-error` — builder identity (error)
 * - `data-invalid` — present (`""`) when invalid
 * - `data-required` — present (`""`) when required
 * - `data-disabled` — present (`""`) when disabled
 *
 * @see {@link FormFieldProps} for configuration options
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
} from "../../builders/index.js";
import type { FormFieldProps } from "./types.js";

const metadata = createBuilderMetadata(
	"form-field",
	["root", "label", "control", "description", "error"] as const,
);

/**
 * ColdLight FormField builder.
 *
 * Manages ARIA linkage between label, control, description, and error
 * elements for the compound form field pattern. Provides `aria-describedby`
 * composition, `aria-invalid`, and `aria-required` propagation.
 *
 * @example
 * ```typescript
 * const field = new FormField({ required: true, error: "Name is required" });
 * // Spread: <div {...field.root}>
 * //   <label {...field.label}>Name</label>
 * //   <input {...field.control} />
 * //   <p {...field.description}>Enter your full name</p>
 * //   <p {...field.error}>Name is required</p>
 * // </div>
 * ```
 */
export class FormField {
	/** Unique IDs for this builder instance. */
	readonly ids: {
		readonly root: string;
		readonly label: string;
		readonly control: string;
		readonly description: string;
		readonly error: string;
	} = metadata.createIds();

	#invalid: Synced<boolean>;
	#required: Synced<boolean>;
	#disabled: Synced<boolean>;
	#error: Synced<string | undefined>;

	/**
	 * Create a new FormField builder instance.
	 *
	 * @param props - Configuration options for the form field
	 */
	constructor(props: FormFieldProps = {}) {
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

	// =========================================================================
	// Reactive State — Read-only accessors for builder state
	// =========================================================================

	/** Whether the field is in an invalid state. */
	get invalid(): boolean {
		return this.#invalid.current;
	}

	/** Whether the field is required. */
	get required(): boolean {
		return this.#required.current;
	}

	/** Whether the field is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	// =========================================================================
	// Private Helpers
	// =========================================================================

	/**
	 * Build the `aria-describedby` value from description and error IDs.
	 *
	 * Always includes the description ID. Appends the error ID when the field
	 * is invalid and an error message is present.
	 */
	#getDescribedBy(): string | undefined {
		const parts: string[] = [];
		parts.push(this.ids.description);
		if (this.invalid && this.#error.current) {
			parts.push(this.ids.error);
		}
		return parts.length > 0 ? parts.join(" ") : undefined;
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root field wrapper element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-form-field-root`, `id`
	 * - ARIA: `role="group"`, `aria-labelledby`
	 * - Data: `data-invalid`, `data-required`, `data-disabled`
	 *
	 * @example
	 * ```svelte
	 * <div {...field.root}>...</div>
	 * ```
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group" as const,
			"aria-labelledby": this.ids.label,
			"data-invalid": dataAttr(this.invalid),
			"data-required": dataAttr(this.required),
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Spread attributes for the label element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-form-field-label`, `id`
	 * - HTML: `for` (linked to control ID)
	 * - Data: `data-required`, `data-disabled`
	 *
	 * @example
	 * ```svelte
	 * <label {...field.label}>Email address</label>
	 * ```
	 */
	get label() {
		return {
			[metadata.dataAttrs.label]: "",
			id: this.ids.label,
			for: this.ids.control,
			"data-required": dataAttr(this.required),
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Spread attributes for the control element (input, select, textarea, etc.).
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-form-field-control`, `id`
	 * - ARIA: `aria-describedby`, `aria-invalid`, `aria-required`, `aria-disabled`
	 * - Data: `data-invalid`, `data-required`, `data-disabled`
	 *
	 * @example
	 * ```svelte
	 * <input {...field.control} />
	 * ```
	 */
	get control() {
		return {
			[metadata.dataAttrs.control]: "",
			id: this.ids.control,
			"aria-describedby": this.#getDescribedBy(),
			"aria-invalid": this.invalid ? "true" as const : undefined,
			"aria-required": this.required ? "true" as const : undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"data-invalid": dataAttr(this.invalid),
			"data-required": dataAttr(this.required),
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Spread attributes for the description/help text element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-form-field-description`, `id`
	 *
	 * @example
	 * ```svelte
	 * <p {...field.description}>We'll never share your email.</p>
	 * ```
	 */
	get description() {
		return {
			[metadata.dataAttrs.description]: "",
			id: this.ids.description,
		};
	}

	/**
	 * Spread attributes for the error message element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-form-field-error`, `id`
	 * - ARIA: `role="alert"`, `aria-live="polite"`
	 * - Data: `data-invalid`
	 *
	 * @example
	 * ```svelte
	 * {#if field.invalid}
	 *   <p {...field.error}>This field is required.</p>
	 * {/if}
	 * ```
	 */
	get error() {
		return {
			[metadata.dataAttrs.error]: "",
			id: this.ids.error,
			role: "alert" as const,
			"aria-live": "polite" as const,
			"data-invalid": dataAttr(this.invalid),
		};
	}
}

/**
 * Factory function for the FormField builder.
 *
 * Preferred API — matches MeltUI convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the form field
 * @returns A new {@link FormField} instance
 *
 * @example
 * ```typescript
 * const field = createFormField({ required: true, invalid: () => hasError });
 * ```
 */
export function createFormField(props?: FormFieldProps): FormField {
	return new FormField(props);
}
