/**
 * useButton — ColdLight button primitive hook.
 *
 * Svelte 5 runes-native. Returns reactive ARIA attributes, keyboard handlers,
 * and data attributes to spread onto a `<button>` element.
 *
 * Supports three modes:
 * 1. **Standard** — click fires native click
 * 2. **Toggle** — `pressed` defined, click toggles on/off, emits `aria-pressed`
 * 3. **Menu trigger** — `expanded` defined, emits `aria-expanded`
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import { controllable } from "../../_internal/utils/controllable.svelte.js";
import { disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { buttonAnatomy } from "./button.anatomy.js";
import type { UseButtonProps, UseButtonReturn } from "./button.types.js";

export function useButton(props: UseButtonProps = {}): UseButtonReturn {
	const id = uid("btn");

	// ── Reactive state ──────────────────────────────────────────
	// A toggle button when `pressed` (controlled) or `defaultPressed` (its own state) is given.
	const isToggle = $derived(props.pressed !== undefined || props.defaultPressed !== undefined);
	const pressedState = controllable({
		value: () => props.pressed,
		defaultValue: () => props.defaultPressed ?? false,
		onChange: (next) => props.onPressedChange?.(next),
	});
	const pressed = $derived(isToggle ? pressedState.current : undefined);
	const isDisabled = $derived(props.disabled || props.loading || false);

	function setPressed(next: boolean): void {
		if (isToggle && !isDisabled) pressedState.set(next);
	}

	function togglePressed(): void {
		setPressed(!pressedState.current);
	}

	// ── Root slot attributes (reactive via $derived) ────────────
	const root = $derived({
		id,
		...buttonAnatomy.attrs.root,

		// HTML
		type: props.type ?? ("button" as const),
		role: "button" as const,

		// ARIA
		"aria-disabled": disabledAttr(isDisabled),
		"aria-pressed": pressed,
		"aria-expanded": props.expanded,
		"aria-busy": props.loading || undefined,

		// Data attributes (styling hooks)
		"data-disabled": isDisabled ? ("" as const) : undefined,
		"data-loading": props.loading ? ("" as const) : undefined,
		"data-state": isToggle ? (pressed ? ("on" as const) : ("off" as const)) : undefined,

		// Event handlers
		onclick: (e: MouseEvent) => {
			if (isDisabled) {
				e.preventDefault();
				return;
			}
			if (isToggle) togglePressed();
		},

		// A native <button> activates itself on Enter and Space, and its click toggles. Only a
		// non-native root needs the keys turned into a click; toggling here as well toggled twice.
		onkeydown: (e: KeyboardEvent) => {
			if (isDisabled || e.currentTarget instanceof HTMLButtonElement) return;
			if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
				e.preventDefault();
				(e.currentTarget as HTMLElement).click();
			}
		},
	});

	// ── Public API ──────────────────────────────────────────────
	return {
		get root() {
			return root;
		},
		get pressed() {
			return pressed;
		},
		get isDisabled() {
			return isDisabled;
		},
		press() {
			setPressed(true);
		},
		unpress() {
			setPressed(false);
		},
		toggle: togglePressed,
	};
}
