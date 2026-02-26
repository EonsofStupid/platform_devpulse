/**
 * @file builders/button/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Button builder — Svelte 5 runes-native.
 *
 * The Button builder owns all ARIA semantics, keyboard interaction, and
 * data-attribute derivation for the button pattern. Components create
 * a Button instance, spread `builder.root` onto the primitive element,
 * and the builder handles everything else.
 *
 * ## ARIA Semantics
 *
 * - `role="button"` — always present (native `<button>` implies this, explicit for `<div>` usage)
 * - `aria-disabled` — set when disabled or loading (NOT native `disabled`, preserves focusability)
 * - `aria-pressed` — toggle mode only: `true`/`false` reflects pressed state
 * - `aria-expanded` — menu trigger mode only: reflects expanded state of controlled region
 * - `aria-busy` — loading state: `true` when loading
 *
 * ## Keyboard
 *
 * - **Space** — activates button (prevented when disabled/loading)
 * - **Enter** — activates button (prevented when disabled/loading)
 *
 * ## Data Attributes
 *
 * - `data-cl-button-root` — builder identity attribute
 * - `data-disabled` — present (`""`) when disabled or loading
 * - `data-loading` — present (`""`) when loading
 * - `data-state` — toggle mode only: `"on"` or `"off"`
 *
 * ## Modes
 *
 * The Button builder supports three modes determined by props:
 *
 * 1. **Standard** — no `pressed`, no `expanded`. Click fires native click.
 * 2. **Toggle** — `pressed` is defined. Click toggles pressed state, emits `aria-pressed`.
 * 3. **Menu trigger** — `expanded` is defined. Emits `aria-expanded` for associated region.
 *
 * @see {@link ButtonProps} for configuration options
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/ WAI-ARIA APG Button Pattern
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	kbd,
} from "../_internal/index.js";
import type { ButtonProps, ButtonType } from "./types.js";

const metadata = createBuilderMetadata("button", ["root"] as const);

/**
 * ColdLight Button builder.
 *
 * Manages ARIA attributes, keyboard interaction, and data-state derivation
 * for the button pattern. Supports standard, toggle, and menu-trigger modes.
 *
 * @example
 * ```typescript
 * // Standard button
 * const button = new Button();
 * // Spread onto element: <button {...button.root}>Click me</button>
 *
 * // Toggle button
 * const toggle = new Button({ pressed: false, onPressedChange: (v) => console.log(v) });
 *
 * // Menu trigger
 * const trigger = new Button({ expanded: () => menuOpen });
 * ```
 */
export class Button {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

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

	// =========================================================================
	// Reactive State — Read-only accessors for builder state
	// =========================================================================

	/** Whether the button is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/**
	 * The pressed state of the button.
	 *
	 * - `undefined` — not in toggle mode
	 * - `true` — pressed (toggle on)
	 * - `false` — not pressed (toggle off)
	 */
	get pressed(): boolean | undefined {
		return this.#pressed.current;
	}

	/** Whether the button is in a loading state. */
	get loading(): boolean {
		return this.#loading.current;
	}

	/**
	 * The expanded state for menu trigger mode.
	 *
	 * - `undefined` — not controlling an expandable region
	 * - `true` — controlled region is expanded
	 * - `false` — controlled region is collapsed
	 */
	get expanded(): boolean | undefined {
		return this.#expanded.current;
	}

	/** The HTML `type` attribute value. */
	get type(): ButtonType {
		return this.#type.current;
	}

	/** Whether this button is in toggle mode (`pressed` is defined). */
	get isToggle(): boolean {
		return this.pressed !== undefined;
	}

	/**
	 * Whether the button is functionally disabled (disabled OR loading).
	 *
	 * When `true`, click and keyboard activation are prevented.
	 */
	get isDisabled(): boolean {
		return this.disabled || this.loading;
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root `<button>` element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-button-root`, `id`
	 * - HTML: `type`, `role`
	 * - ARIA: `aria-disabled`, `aria-pressed`, `aria-expanded`, `aria-busy`
	 * - Data: `data-disabled`, `data-loading`, `data-state`
	 * - Handlers: `onclick`, `onkeydown`
	 *
	 * @example
	 * ```svelte
	 * <button {...builder.root}>Click me</button>
	 * ```
	 */
	get root() {
		const isDisabled = this.isDisabled;

		return {
			"data-cl-button-root": "",
			id: this.ids.root,
			type: this.type,
			role: "button" as const,
			"aria-disabled": disabledAttr(isDisabled),
			"aria-pressed": this.pressed,
			"aria-expanded": this.expanded,
			"aria-busy": this.loading || undefined,
			"data-disabled": dataAttr(isDisabled),
			"data-loading": dataAttr(this.loading),
			"data-state": this.isToggle
				? this.pressed ? "on" as const : "off" as const
				: undefined,

			onclick: (e: MouseEvent) => {
				if (isDisabled) {
					e.preventDefault();
					return;
				}
				if (this.isToggle) {
					this.#togglePressed();
				}
			},

			onkeydown: (e: KeyboardEvent) => {
				if (isDisabled) return;

				if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
					e.preventDefault();
					if (this.isToggle) {
						this.#togglePressed();
					}
					(e.currentTarget as HTMLElement).click();
				}
			},
		};
	}

	// =========================================================================
	// Programmatic Helpers
	// =========================================================================

	/**
	 * Programmatically press the button (toggle mode only).
	 *
	 * Sets `pressed` to `true`. No-op if already pressed, disabled, or not in toggle mode.
	 */
	press(): void {
		if (!this.isToggle || this.isDisabled || this.pressed) return;
		this.#pressed.current = true;
		this.#onPressedChange?.(true);
	}

	/**
	 * Programmatically unpress the button (toggle mode only).
	 *
	 * Sets `pressed` to `false`. No-op if already unpressed, disabled, or not in toggle mode.
	 */
	unpress(): void {
		if (!this.isToggle || this.isDisabled || !this.pressed) return;
		this.#pressed.current = false;
		this.#onPressedChange?.(false);
	}

	/**
	 * Programmatically toggle the pressed state (toggle mode only).
	 *
	 * No-op if disabled or not in toggle mode.
	 */
	toggle(): void {
		if (!this.isToggle || this.isDisabled) return;
		this.#togglePressed();
	}

	// =========================================================================
	// Private
	// =========================================================================

	/** Toggle pressed state and fire callback. */
	#togglePressed(): void {
		const next = !this.pressed;
		this.#pressed.current = next;
		this.#onPressedChange?.(next);
	}
}

/**
 * Factory function for the Button builder.
 *
 * Preferred API — matches MeltUI convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the button
 * @returns A new {@link Button} instance
 *
 * @example
 * ```typescript
 * const button = createButton({ disabled: () => isLoading });
 * ```
 */
export function createButton(props?: ButtonProps): Button {
	return new Button(props);
}
