/**
 * useToggle — ColdLight toggle button primitive hook.
 *
 * A button with binary pressed/unpressed state via aria-pressed.
 * Simpler than useButton — always a toggle, no menu-trigger mode.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import { disabledAttr } from "../_internal/utils/data-attr.js";
import { kbd } from "../_internal/utils/kbd.js";
import { uid } from "../_internal/utils/uid.js";
import { toggleAnatomy } from "./toggle.anatomy.js";
import type { UseToggleProps, UseToggleReturn } from "./toggle.types.js";

export function useToggle(props: UseToggleProps = {}): UseToggleReturn {
	const id = uid("toggle");

	let pressed = $state(props.pressed ?? false);
	const disabled = $derived(props.disabled ?? false);

	function doToggle(): void {
		if (disabled) return;
		pressed = !pressed;
		props.onPressedChange?.(pressed);
	}

	const root = $derived({
		...toggleAnatomy.attrs.root,
		id,
		type: "button" as const,
		role: "button" as const,
		"aria-pressed": pressed,
		"aria-disabled": disabledAttr(disabled),
		"aria-label": props["aria-label"],
		"data-state": pressed ? ("on" as const) : ("off" as const),
		"data-disabled": disabled ? ("" as const) : undefined,
		onclick: (e: MouseEvent) => {
			if (disabled) {
				e.preventDefault();
				return;
			}
			doToggle();
		},
		onkeydown: (e: KeyboardEvent) => {
			if (disabled) return;
			if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
				e.preventDefault();
				doToggle();
			}
		},
	});

	return {
		get pressed() {
			return pressed;
		},
		get root() {
			return root;
		},
		toggle: doToggle,
	};
}
