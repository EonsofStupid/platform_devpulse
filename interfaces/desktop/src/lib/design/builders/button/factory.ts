/**
 * @file builders/button/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Button builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * role="button" (native when rendered as <button>).
 * aria-disabled — used instead of native disabled for keyboard focusability.
 * aria-pressed — toggle mode (when pressed prop is provided).
 * aria-expanded — menu trigger mode (when expanded prop is provided).
 * aria-busy — loading state.
 *
 * Keyboard: Space + Enter activate the button.
 *
 * Contract: primitives/button/contract.ts
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	kbd,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { ButtonProps, ButtonType } from "./types.js";

const metadata = createBuilderMetadata("button", ["root"] as const);

export class Button {
	readonly ids = metadata.createIds();

	#disabled: Synced<boolean>;
	#pressed: Synced<boolean | undefined>;
	#loading: Synced<boolean>;
	#expanded: Synced<boolean | undefined>;
	#type: Synced<ButtonType>;
	#onPressedChange: ((pressed: boolean) => void) | undefined;

	constructor(props: ButtonProps = {}) {
		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});
		this.#pressed = new Synced<boolean | undefined>({
			value: props.pressed,
			defaultValue: undefined,
		});
		this.#loading = new Synced<boolean>({
			value: props.loading,
			defaultValue: false,
		});
		this.#expanded = new Synced<boolean | undefined>({
			value: props.expanded,
			defaultValue: undefined,
		});
		this.#type = new Synced<ButtonType>({
			value: props.type,
			defaultValue: "button",
		});
		this.#onPressedChange = props.onPressedChange;
	}

	// --- Reactive state ---

	get disabled(): boolean {
		return this.#disabled.current;
	}

	get pressed(): boolean | undefined {
		return this.#pressed.current;
	}

	get loading(): boolean {
		return this.#loading.current;
	}

	get expanded(): boolean | undefined {
		return this.#expanded.current;
	}

	get type(): ButtonType {
		return this.#type.current;
	}

	/** Whether this button operates in toggle mode. */
	get isToggle(): boolean {
		return this.pressed !== undefined;
	}

	// --- Element attribute getters ---

	/** Root <button> attributes. */
	get root(): SlotAttrs {
		const isDisabled = this.disabled || this.loading;

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			type: this.type,
			role: "button",
			"aria-disabled": disabledAttr(isDisabled),
			"aria-pressed": this.pressed,
			"aria-expanded": this.expanded,
			"aria-busy": this.loading || undefined,
			"data-disabled": dataAttr(isDisabled),
			"data-state": this.isToggle
				? this.pressed ? "on" : "off"
				: undefined,
			"data-loading": dataAttr(this.loading),

			onclick: (e: MouseEvent) => {
				if (isDisabled) {
					e.preventDefault();
					return;
				}
				if (this.isToggle) {
					const next = !this.pressed;
					this.#pressed.current = next;
					this.#onPressedChange?.(next);
				}
			},

			onkeydown: (e: KeyboardEvent) => {
				if (isDisabled) return;

				if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
					e.preventDefault();
					if (this.isToggle) {
						const next = !this.pressed;
						this.#pressed.current = next;
						this.#onPressedChange?.(next);
					}
					// For non-toggle buttons, the native click event fires on Enter/Space
					// for <button> elements. We still prevent default to avoid scroll on Space.
					(e.currentTarget as HTMLElement).click();
				}
			},
		};
	}
}

/** Factory function — preferred API. */
export function createButton(props?: ButtonProps): Button {
	return new Button(props);
}
