/**
 * useSearchField — ColdLight search input primitive hook.
 *
 * Search landmark (role=search) with searchbox input, decorative icon,
 * clear button, and Escape-to-clear keyboard support.
 * Parts: root, input, icon, clear.
 */

import { dataAttr, disabledAttr } from "../_internal/utils/data-attr.js";
import { kbd } from "../_internal/utils/kbd.js";
import { createIds } from "../_internal/utils/uid.js";
import { searchFieldAnatomy } from "./search-field.anatomy.js";
import type { UseSearchFieldProps, UseSearchFieldReturn } from "./search-field.types.js";

export function useSearchField(props: UseSearchFieldProps = {}): UseSearchFieldReturn {
	const ids = createIds("search-field", ["root", "input", "icon", "clear"] as const);

	let value = $state(props.value ?? "");
	const disabled = $derived(props.disabled ?? false);
	const hasValue = $derived(value.length > 0);

	function doClear(): void {
		value = "";
		props.onValueChange?.("");
		props.onClear?.();
		document.getElementById(ids.input)?.focus();
	}

	const root = $derived({
		...searchFieldAnatomy.attrs.root,
		id: ids.root,
		role: "search" as const,
		"aria-label": props["aria-label"] ?? "Search",
		"data-disabled": dataAttr(disabled),
		"data-has-value": dataAttr(hasValue),
	});

	const input = $derived({
		...searchFieldAnatomy.attrs.input,
		id: ids.input,
		role: "searchbox" as const,
		type: "search" as const,
		value,
		placeholder: props.placeholder ?? "Search...",
		disabled: disabled || undefined,
		"aria-label": props["aria-label"] ?? "Search",
		"aria-describedby": props["aria-describedby"],
		"aria-disabled": disabledAttr(disabled),
		"data-disabled": dataAttr(disabled),
		oninput: (e: Event) => {
			value = (e.target as HTMLInputElement).value;
			props.onValueChange?.(value);
		},
		onkeydown: (e: KeyboardEvent) => {
			if (disabled) return;
			if (e.key === kbd.ESCAPE && hasValue) {
				e.preventDefault();
				doClear();
			}
		},
	});

	const icon = $derived({
		...searchFieldAnatomy.attrs.icon,
		id: ids.icon,
		"aria-hidden": "true" as const,
	});

	const clear = $derived({
		...searchFieldAnatomy.attrs.clear,
		id: ids.clear,
		type: "button" as const,
		tabindex: hasValue ? (0 as const) : (-1 as const),
		"aria-label": "Clear search" as const,
		"aria-disabled": disabledAttr(disabled || !hasValue),
		"data-disabled": dataAttr(disabled || !hasValue),
		"data-visible": dataAttr(hasValue),
		onclick: () => {
			if (!disabled) doClear();
		},
	});

	return {
		get value() {
			return value;
		},
		get hasValue() {
			return hasValue;
		},
		get root() {
			return root;
		},
		get input() {
			return input;
		},
		get icon() {
			return icon;
		},
		get clear() {
			return clear;
		},
		clearValue: doClear,
	};
}
