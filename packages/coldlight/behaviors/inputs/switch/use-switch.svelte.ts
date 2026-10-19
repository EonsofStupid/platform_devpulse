/**
 * useSwitch — ColdLight switch primitive hook.
 *
 * Binary on/off toggle with role=switch.
 * Parts: root (button), thumb (visual indicator), label (click-to-toggle).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { switchAnatomy } from "./switch.anatomy.js";
import type { UseSwitchProps, UseSwitchReturn } from "./switch.types.js";

export function useSwitch(props: UseSwitchProps = {}): UseSwitchReturn {
	const id = uid("switch");

	let checked = $state(props.checked ?? false);
	const disabled = $derived(props.disabled ?? false);

	function doToggle(): void {
		if (disabled) return;
		checked = !checked;
		props.onCheckedChange?.(checked);
	}

	const root = $derived({
		...switchAnatomy.attrs.root,
		id,
		role: "switch" as const,
		type: "button" as const,
		tabindex: 0 as const,
		"aria-checked": checked,
		"aria-disabled": disabledAttr(disabled),
		"aria-required": props.required ? (true as const) : undefined,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"aria-describedby": props["aria-describedby"],
		"data-state": checked ? ("checked" as const) : ("unchecked" as const),
		"data-disabled": dataAttr(disabled),
		onclick: () => doToggle(),
		onkeydown: (e: KeyboardEvent) => {
			if (disabled) return;
			if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
				e.preventDefault();
				doToggle();
			}
		},
	});

	const thumb = $derived({
		...switchAnatomy.attrs.thumb,
		"aria-hidden": "true" as const,
		"data-state": checked ? ("checked" as const) : ("unchecked" as const),
	});

	const label = $derived({
		...switchAnatomy.attrs.label,
		"data-disabled": dataAttr(disabled),
		onclick: () => {
			if (disabled) return;
			document.getElementById(id)?.click();
			document.getElementById(id)?.focus();
		},
	});

	return {
		get checked() {
			return checked;
		},
		get root() {
			return root;
		},
		get thumb() {
			return thumb;
		},
		get label() {
			return label;
		},
		toggle: doToggle,
		turnOn() {
			if (!disabled && !checked) {
				checked = true;
				props.onCheckedChange?.(true);
			}
		},
		turnOff() {
			if (!disabled && checked) {
				checked = false;
				props.onCheckedChange?.(false);
			}
		},
	};
}
