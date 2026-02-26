/**
 * @file builders/switch/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Switch builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: `role="switch"`, `aria-checked`
 * - Thumb: `aria-hidden="true"` (presentational sliding indicator)
 * - Label: click-to-toggle association
 *
 * Keyboard interaction:
 * | Key   | Action                        |
 * |-------|-------------------------------|
 * | Space | Toggles the switch on/off     |
 * | Enter | Toggles the switch on/off     |
 *
 * Data attributes:
 * | Attribute        | Values                            |
 * |------------------|-----------------------------------|
 * | `data-state`     | `"checked"` | `"unchecked"`       |
 * | `data-disabled`  | `""` (present) or absent          |
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	kbd,
} from "../_internal/index.js";
import type { SwitchProps } from "./types.js";

const metadata = createBuilderMetadata("switch", ["root", "thumb", "label"] as const);

/**
 * ColdLight Switch builder.
 *
 * Provides a fully accessible toggle switch widget with on/off semantics.
 * All ARIA semantics are managed internally — consumers spread slot
 * attributes onto their elements.
 *
 * @example
 * ```ts
 * const sw = createSwitch({ checked: () => isOn });
 * ```
 */
export class Switch {
	#checked: Synced<boolean>;
	#disabled: Synced<boolean>;
	#required: Synced<boolean>;
	#props: SwitchProps;

	/**
	 * Unique IDs for each slot element of this switch instance.
	 * Generated once at construction time via `createBuilderMetadata`.
	 */
	readonly ids: { readonly root: string; readonly thumb: string; readonly label: string } = metadata.createIds();

	/**
	 * Create a new Switch builder instance.
	 *
	 * @param props - Configuration props. All are optional with sensible defaults.
	 */
	constructor(props: SwitchProps = {}) {
		this.#props = props;

		this.#checked = new Synced<boolean>({
			value: props.checked,
			onChange: props.onCheckedChange,
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

	/** Whether the switch is currently on (checked). */
	get checked(): boolean {
		return this.#checked.current;
	}

	/** Set the checked state directly. */
	set checked(value: boolean) {
		this.#checked.current = value;
	}

	/** Whether the switch is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/** Whether the switch is required. */
	get required(): boolean {
		return this.#required.current;
	}

	// ======================================================================
	// Slot Attribute Getters
	// ======================================================================

	/**
	 * Root element attributes.
	 *
	 * Spread onto the switch button element. Provides `role="switch"`,
	 * `aria-checked`, keyboard handling (Space, Enter), and click handling.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "switch" as const,
			type: "button" as const,
			"aria-checked": this.checked,
			"aria-disabled": disabledAttr(this.disabled),
			"aria-required": this.required ? (true as const) : undefined,
			"aria-label": this.#props["aria-label"],
			"aria-labelledby": this.#props["aria-labelledby"],
			"aria-describedby": this.#props["aria-describedby"],
			"data-state": this.checked ? ("checked" as const) : ("unchecked" as const),
			"data-disabled": dataAttr(this.disabled),
			tabindex: 0 as const,

			onclick: () => {
				if (this.disabled) return;
				this.#checked.current = !this.checked;
			},

			onkeydown: (e: KeyboardEvent) => {
				if (this.disabled) return;
				if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
					e.preventDefault();
					this.#checked.current = !this.checked;
				}
			},
		};
	}

	/**
	 * Thumb element attributes.
	 *
	 * Spread onto the sliding thumb indicator. Marked as
	 * `aria-hidden="true"` since it is purely presentational.
	 */
	get thumb() {
		return {
			[metadata.dataAttrs.thumb]: "",
			id: this.ids.thumb,
			"aria-hidden": "true" as const,
			"data-state": this.checked ? ("checked" as const) : ("unchecked" as const),
		};
	}

	/**
	 * Label element attributes.
	 *
	 * Spread onto the label text element. Clicking the label toggles
	 * the switch and moves focus to the root element.
	 */
	get label() {
		return {
			[metadata.dataAttrs.label]: "",
			id: this.ids.label,
			"data-disabled": dataAttr(this.disabled),

			onclick: () => {
				if (this.disabled) return;
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
	 * Turn the switch on programmatically.
	 *
	 * Sets checked to `true`. No-op if disabled or already on.
	 */
	turnOn(): void {
		if (this.disabled) return;
		this.#checked.current = true;
	}

	/**
	 * Turn the switch off programmatically.
	 *
	 * Sets checked to `false`. No-op if disabled or already off.
	 */
	turnOff(): void {
		if (this.disabled) return;
		this.#checked.current = false;
	}

	/**
	 * Toggle the switch state programmatically.
	 *
	 * Flips checked between `true` and `false`. No-op if disabled.
	 */
	toggle(): void {
		if (this.disabled) return;
		this.#checked.current = !this.checked;
	}
}

/**
 * Factory function for the Switch builder — preferred API.
 *
 * @param props - Optional switch configuration props.
 * @returns A new {@link Switch} instance.
 *
 * @example
 * ```ts
 * const sw = createSwitch({ checked: () => isOn });
 * ```
 */
export function createSwitch(props?: SwitchProps): Switch {
	return new Switch(props);
}
