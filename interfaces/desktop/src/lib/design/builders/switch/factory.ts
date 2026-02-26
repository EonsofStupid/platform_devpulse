/**
 * @file builders/switch/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Switch builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: role="switch", aria-checked
 * - Thumb: aria-hidden="true" (presentational)
 * - Label: click to toggle
 *
 * Keyboard: Space, Enter — toggles checked state.
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
import type { SlotAttrs } from "../_internal/types.js";
import type { SwitchProps } from "./types.js";

const metadata = createBuilderMetadata("switch", ["root", "thumb", "label"] as const);

export class Switch {
	#checked: Synced<boolean>;
	#disabled: Synced<boolean>;
	#required: Synced<boolean>;
	#props: SwitchProps;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: SwitchProps = {} as SwitchProps) {
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

	// --- Reactive state ---

	get checked(): boolean {
		return this.#checked.current;
	}

	set checked(value: boolean) {
		this.#checked.current = value;
	}

	get disabled(): boolean {
		return this.#disabled.current;
	}

	get required(): boolean {
		return this.#required.current;
	}

	// --- Slot attribute getters ---

	/** Root element attributes. Spread onto the switch button element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "switch",
			type: "button",
			"aria-checked": this.checked,
			"aria-disabled": disabledAttr(this.disabled),
			"aria-required": this.required ? true : undefined,
			"aria-label": this.#props["aria-label"],
			"aria-labelledby": this.#props["aria-labelledby"],
			"aria-describedby": this.#props["aria-describedby"],
			"data-state": this.checked ? "checked" : "unchecked",
			"data-disabled": dataAttr(this.disabled),
			tabindex: 0,

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

	/** Thumb element attributes. Spread onto the sliding thumb indicator. */
	get thumb(): SlotAttrs {
		return {
			[metadata.dataAttrs.thumb]: "",
			id: this.ids.thumb,
			"aria-hidden": "true",
			"data-state": this.checked ? "checked" : "unchecked",
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
				const rootEl = document.getElementById(this.ids.root);
				rootEl?.click();
				rootEl?.focus();
			},
		};
	}

	/** Toggle the checked state programmatically. */
	toggle(): void {
		if (this.disabled) return;
		this.#checked.current = !this.checked;
	}
}

/** Factory function — preferred API. */
export function createSwitch(props?: SwitchProps): Switch {
	return new Switch(props);
}
