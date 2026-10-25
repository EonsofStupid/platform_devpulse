/**
 * @file builders/checkbox/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Checkbox builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: `role="checkbox"`, `aria-checked="true"|"false"|"mixed"`
 * - Indicator: `aria-hidden="true"` (presentational, decorative icon container)
 * - Label: click-to-toggle association via `aria-labelledby`
 *
 * Keyboard interaction:
 * | Key   | Action                          |
 * |-------|---------------------------------|
 * | Space | Toggles the checked state       |
 *
 * Data attributes:
 * | Attribute        | Values                                  |
 * |------------------|-----------------------------------------|
 * | `data-state`     | `"checked"` | `"unchecked"` | `"indeterminate"` |
 * | `data-disabled`  | `""` (present) or absent                |
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	kbd,
} from "../../builders/index.js";
import type { CheckboxProps } from "./types.js";

const metadata = createBuilderMetadata("checkbox", ["root", "indicator", "label"] as const);

/**
 * ColdLight Checkbox builder.
 *
 * Provides a fully accessible checkbox widget with support for checked,
 * unchecked, and indeterminate (mixed) states. All ARIA semantics are
 * managed internally — consumers spread slot attributes onto their elements.
 *
 * @example
 * ```ts
 * const checkbox = createCheckbox({ checked: () => isChecked });
 * ```
 */
export class Checkbox {
	#checked: Synced<boolean>;
	#indeterminate: Synced<boolean>;
	#disabled: Synced<boolean>;
	#required: Synced<boolean>;
	#props: CheckboxProps;

	/**
	 * Unique IDs for each slot element of this checkbox instance.
	 * Generated once at construction time via `createBuilderMetadata`.
	 */
	readonly ids: { readonly root: string; readonly indicator: string; readonly label: string } = metadata.createIds();

	/**
	 * Create a new Checkbox builder instance.
	 *
	 * @param props - Configuration props. All are optional with sensible defaults.
	 */
	constructor(props: CheckboxProps = {}) {
		this.#props = props;

		this.#checked = new Synced<boolean>({
			value: props.checked,
			onChange: props.onCheckedChange,
			defaultValue: false,
		});

		this.#indeterminate = new Synced<boolean>({
			value: props.indeterminate,
			onChange: props.onIndeterminateChange,
			defaultValue: false,
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});

		this.#required = new Synced<boolean>({
			value: props.required,
			defaultValue: false,
		});
	}

	// ======================================================================
	// Reactive State
	// ======================================================================

	/** Whether the checkbox is currently checked. */
	get checked(): boolean {
		return this.#checked.current;
	}

	/** Set the checked state directly. */
	set checked(value: boolean) {
		this.#checked.current = value;
	}

	/** Whether the checkbox is in the indeterminate (mixed) state. */
	get indeterminate(): boolean {
		return this.#indeterminate.current;
	}

	/** Whether the checkbox is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/** Whether the checkbox is required. */
	get required(): boolean {
		return this.#required.current;
	}

	// ======================================================================
	// Private
	// ======================================================================

	/** Compute the `aria-checked` value based on indeterminate and checked state. */
	#getAriaChecked(): "true" | "false" | "mixed" {
		if (this.indeterminate) return "mixed" as const;
		return this.checked ? ("true" as const) : ("false" as const);
	}

	/** Compute the `data-state` value based on indeterminate and checked state. */
	#getDataState(): "checked" | "unchecked" | "indeterminate" {
		if (this.indeterminate) return "indeterminate" as const;
		return this.checked ? ("checked" as const) : ("unchecked" as const);
	}

	// ======================================================================
	// Slot Attribute Getters
	// ======================================================================

	/**
	 * Root element attributes.
	 *
	 * Spread onto the checkbox button element. Provides `role="checkbox"`,
	 * `aria-checked`, keyboard handling (Space), and click handling.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "checkbox" as const,
			type: "button" as const,
			"aria-checked": this.#getAriaChecked(),
			"aria-disabled": disabledAttr(this.disabled),
			"aria-required": this.required ? (true as const) : undefined,
			"aria-label": this.#props["aria-label"],
			"aria-labelledby": this.#props["aria-labelledby"],
			"aria-describedby": this.#props["aria-describedby"],
			"data-state": this.#getDataState(),
			"data-disabled": dataAttr(this.disabled),
			tabindex: 0 as const,

			onclick: () => {
				if (this.disabled) return;
				if (this.indeterminate) {
					this.#indeterminate.current = false;
				}
				this.#checked.current = !this.checked;
			},

			onkeydown: (e: KeyboardEvent) => {
				if (this.disabled) return;
				if (e.key === kbd.SPACE) {
					e.preventDefault();
					if (this.indeterminate) {
						this.#indeterminate.current = false;
					}
					this.#checked.current = !this.checked;
				}
			},
		};
	}

	/**
	 * Indicator element attributes.
	 *
	 * Spread onto the visual indicator (icon container). Marked as
	 * `aria-hidden="true"` since it is purely presentational.
	 */
	get indicator() {
		return {
			[metadata.dataAttrs.indicator]: "",
			id: this.ids.indicator,
			"aria-hidden": "true" as const,
			"data-state": this.#getDataState(),
		};
	}

	/**
	 * Label element attributes.
	 *
	 * Spread onto the label text element. Clicking the label toggles
	 * the checkbox and moves focus to the root element.
	 */
	get label() {
		return {
			[metadata.dataAttrs.label]: "",
			id: this.ids.label,
			"data-disabled": dataAttr(this.disabled),

			onclick: () => {
				if (this.disabled) return;
				// Clicking the label should toggle the checkbox
				const rootEl = document.getElementById(this.ids.root);
				rootEl?.click();
				rootEl?.focus();
			},
		};
	}

	// ======================================================================
	// Programmatic Helpers
	// ======================================================================

	/**
	 * Toggle the checked state programmatically.
	 *
	 * If the checkbox is indeterminate, clears that state first, then
	 * flips checked. No-op if disabled.
	 */
	toggle(): void {
		if (this.disabled) return;
		if (this.indeterminate) {
			this.#indeterminate.current = false;
		}
		this.#checked.current = !this.checked;
	}

	/**
	 * Set the checkbox to checked programmatically.
	 *
	 * Clears indeterminate state if active. No-op if disabled or already checked.
	 */
	check(): void {
		if (this.disabled) return;
		if (this.indeterminate) {
			this.#indeterminate.current = false;
		}
		this.#checked.current = true;
	}

	/**
	 * Set the checkbox to unchecked programmatically.
	 *
	 * Clears indeterminate state if active. No-op if disabled or already unchecked.
	 */
	uncheck(): void {
		if (this.disabled) return;
		if (this.indeterminate) {
			this.#indeterminate.current = false;
		}
		this.#checked.current = false;
	}
}

/**
 * Factory function for the Checkbox builder — preferred API.
 *
 * @param props - Optional checkbox configuration props.
 * @returns A new {@link Checkbox} instance.
 *
 * @example
 * ```ts
 * const checkbox = createCheckbox({ checked: () => value });
 * ```
 */
export function createCheckbox(props?: CheckboxProps): Checkbox {
	return new Checkbox(props);
}
