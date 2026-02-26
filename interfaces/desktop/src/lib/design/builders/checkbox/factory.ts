/**
 * @file builders/checkbox/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Checkbox builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: role="checkbox", aria-checked="true"|"false"|"mixed"
 * - Indicator: aria-hidden="true" (presentational)
 * - Label: associated via aria-labelledby
 *
 * Keyboard: Space — toggles checked state.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	kbd,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { CheckboxProps } from "./types.js";

const metadata = createBuilderMetadata("checkbox", ["root", "indicator", "label"] as const);

export class Checkbox {
	#checked: Synced<boolean>;
	#indeterminate: Synced<boolean>;
	#disabled: Synced<boolean>;
	#required: Synced<boolean>;
	#props: CheckboxProps;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: CheckboxProps = {} as CheckboxProps) {
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

	// --- Reactive state ---

	get checked(): boolean {
		return this.#checked.current;
	}

	set checked(value: boolean) {
		this.#checked.current = value;
	}

	get indeterminate(): boolean {
		return this.#indeterminate.current;
	}

	get disabled(): boolean {
		return this.#disabled.current;
	}

	get required(): boolean {
		return this.#required.current;
	}

	// --- Private helpers ---

	#getAriaChecked(): "true" | "false" | "mixed" {
		if (this.indeterminate) return "mixed";
		return this.checked ? "true" : "false";
	}

	#getDataState(): "checked" | "unchecked" | "indeterminate" {
		if (this.indeterminate) return "indeterminate";
		return this.checked ? "checked" : "unchecked";
	}

	// --- Slot attribute getters ---

	/** Root element attributes. Spread onto the checkbox button element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "checkbox",
			type: "button",
			"aria-checked": this.#getAriaChecked(),
			"aria-disabled": disabledAttr(this.disabled),
			"aria-required": this.required ? true : undefined,
			"aria-label": this.#props["aria-label"],
			"aria-labelledby": this.#props["aria-labelledby"],
			"aria-describedby": this.#props["aria-describedby"],
			"data-state": this.#getDataState(),
			"data-disabled": dataAttr(this.disabled),
			tabindex: 0,

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

	/** Indicator element attributes. Spread onto the visual indicator (icon container). */
	get indicator(): SlotAttrs {
		return {
			[metadata.dataAttrs.indicator]: "",
			id: this.ids.indicator,
			"aria-hidden": "true",
			"data-state": this.#getDataState(),
		};
	}

	/** Label element attributes. Spread onto the label text element. */
	get label(): SlotAttrs {
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

	/** Toggle the checked state programmatically. */
	toggle(): void {
		if (this.disabled) return;
		if (this.indeterminate) {
			this.#indeterminate.current = false;
		}
		this.#checked.current = !this.checked;
	}
}

/** Factory function — preferred API. */
export function createCheckbox(props?: CheckboxProps): Checkbox {
	return new Checkbox(props);
}
