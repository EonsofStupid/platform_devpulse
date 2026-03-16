/**
 * useCheckbox — ColdLight checkbox primitive hook.
 *
 * Svelte 5 runes-native. Tri-state: checked, unchecked, indeterminate (mixed).
 * Parts: root (button with role=checkbox), indicator (decorative), label (click-to-toggle).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 *
 * @example
 * ```svelte
 * <script>
 *   import { useCheckbox } from '$lib/design/coldlight';
 *   let checked = $state(false);
 *   const checkbox = useCheckbox({
 *     checked,
 *     onCheckedChange: (v) => checked = v,
 *   });
 * </script>
 * <button {...checkbox.root}>
 *   <span {...checkbox.indicator}>{checked ? '✓' : ''}</span>
 * </button>
 * <span {...checkbox.label}>Accept terms</span>
 * ```
 */

import { createIds } from "../../_internal/utils/uid.js";
import { disabledAttr, dataAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { checkboxAnatomy } from "./checkbox.anatomy.js";
import type { UseCheckboxProps, UseCheckboxReturn, CheckboxState } from "./checkbox.types.js";

export function useCheckbox(props: UseCheckboxProps = {}): UseCheckboxReturn {
	const ids = createIds("checkbox", ["root", "indicator", "label"] as const);

	// ── State ────────────────────────────────────────────────────
	let checked = $state(props.checked ?? false);
	let indeterminate = $state(props.indeterminate ?? false);
	const disabled = $derived(props.disabled ?? false);
	const required = $derived(props.required ?? false);

	function getAriaChecked(): "true" | "false" | "mixed" {
		if (indeterminate) return "mixed";
		return checked ? "true" : "false";
	}

	function getDataState(): CheckboxState {
		if (indeterminate) return "indeterminate";
		return checked ? "checked" : "unchecked";
	}

	function doToggle(): void {
		if (disabled) return;
		if (indeterminate) {
			indeterminate = false;
			props.onIndeterminateChange?.(false);
		}
		checked = !checked;
		props.onCheckedChange?.(checked);
	}

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...checkboxAnatomy.attrs.root,
		id: ids.root,
		role: "checkbox" as const,
		type: "button" as const,
		tabindex: 0 as const,
		"aria-checked": getAriaChecked(),
		"aria-disabled": disabledAttr(disabled),
		"aria-required": required ? (true as const) : undefined,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"aria-describedby": props["aria-describedby"],
		"data-state": getDataState(),
		"data-disabled": dataAttr(disabled),

		onclick: () => doToggle(),

		onkeydown: (e: KeyboardEvent) => {
			if (disabled) return;
			if (e.key === kbd.SPACE) {
				e.preventDefault();
				doToggle();
			}
		},
	});

	const indicator = $derived({
		...checkboxAnatomy.attrs.indicator,
		id: ids.indicator,
		"aria-hidden": "true" as const,
		"data-state": getDataState(),
	});

	const label = $derived({
		...checkboxAnatomy.attrs.label,
		id: ids.label,
		"data-disabled": dataAttr(disabled),

		onclick: () => {
			if (disabled) return;
			const rootEl = document.getElementById(ids.root);
			rootEl?.click();
			rootEl?.focus();
		},
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		get checked() { return checked; },
		get indeterminate() { return indeterminate; },
		get root() { return root; },
		get indicator() { return indicator; },
		get label() { return label; },
		toggle: doToggle,
		check() {
			if (disabled) return;
			if (indeterminate) { indeterminate = false; props.onIndeterminateChange?.(false); }
			checked = true;
			props.onCheckedChange?.(true);
		},
		uncheck() {
			if (disabled) return;
			if (indeterminate) { indeterminate = false; props.onIndeterminateChange?.(false); }
			checked = false;
			props.onCheckedChange?.(false);
		},
	};
}
