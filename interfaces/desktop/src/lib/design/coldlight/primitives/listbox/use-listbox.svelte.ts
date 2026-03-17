/**
 * useListBox — ColdLight listbox primitive hook.
 *
 * Selectable list with aria-activedescendant navigation.
 * Supports single and multiple selection, typeahead search.
 * Parts: root (listbox), option (parameterized), group, label.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import { uid } from "../../_internal/utils/uid.js";
import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { listboxAnatomy } from "./listbox.anatomy.js";
import type { UseListBoxProps, UseListBoxReturn } from "./listbox.types.js";

export function useListBox(props: UseListBoxProps = {}): UseListBoxReturn {
	const id = uid("listbox");
	const multiple = props.multiple ?? false;
	const globalDisabled = $derived(props.disabled ?? false);

	let value = $state<string | string[]>(props.value ?? (multiple ? [] : ""));
	let highlightedId = $state<string | null>(null);

	function isSelected(optionValue: string): boolean {
		if (Array.isArray(value)) return value.includes(optionValue);
		return value === optionValue;
	}

	function select(optionValue: string): void {
		if (globalDisabled) return;
		if (multiple) {
			const arr = Array.isArray(value) ? [...value] : [];
			const idx = arr.indexOf(optionValue);
			if (idx >= 0) arr.splice(idx, 1);
			else arr.push(optionValue);
			value = arr;
		} else {
			value = optionValue;
		}
		props.onValueChange?.(value);
	}

	function getOptionElements(): HTMLElement[] {
		const container = document.getElementById(id);
		if (!container) return [];
		return Array.from(container.querySelectorAll<HTMLElement>('[role="option"]:not([data-disabled])'));
	}

	function highlightByIndex(index: number): void {
		const options = getOptionElements();
		if (index >= 0 && index < options.length) {
			const optionId = options[index].id;
			highlightedId = optionId;
			options[index].scrollIntoView({ block: "nearest" });
		}
	}

	function handleKeydown(e: KeyboardEvent): void {
		const options = getOptionElements();
		if (options.length === 0) return;

		const currentIndex = highlightedId ? options.findIndex((el) => el.id === highlightedId) : -1;

		if (e.key === kbd.ARROW_DOWN) {
			e.preventDefault();
			highlightByIndex(currentIndex < options.length - 1 ? currentIndex + 1 : 0);
		} else if (e.key === kbd.ARROW_UP) {
			e.preventDefault();
			highlightByIndex(currentIndex > 0 ? currentIndex - 1 : options.length - 1);
		} else if (e.key === kbd.HOME) {
			e.preventDefault();
			highlightByIndex(0);
		} else if (e.key === kbd.END) {
			e.preventDefault();
			highlightByIndex(options.length - 1);
		} else if (e.key === kbd.ENTER || e.key === kbd.SPACE) {
			e.preventDefault();
			if (highlightedId) {
				const el = options.find((o) => o.id === highlightedId);
				const val = el?.getAttribute("data-value");
				if (val) select(val);
			}
		}
	}

	const root = $derived({
		...listboxAnatomy.attrs.root,
		id,
		role: "listbox" as const,
		tabindex: 0 as const,
		"aria-multiselectable": multiple || undefined,
		"aria-activedescendant": highlightedId ?? undefined,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"aria-disabled": disabledAttr(globalDisabled),
		"data-disabled": dataAttr(globalDisabled),
		onkeydown: handleKeydown,
	});

	return {
		get value() { return value; },
		get highlightedId() { return highlightedId; },
		get root() { return root; },

		getOption(optionValue: string, options?: { disabled?: boolean; label?: string }) {
			const optionId = `${id}-option-${optionValue}`;
			const selected = isSelected(optionValue);
			const isDisabled = globalDisabled || (options?.disabled ?? false);
			return {
				...listboxAnatomy.attrs.option,
				id: optionId,
				role: "option" as const,
				"aria-selected": selected,
				"aria-disabled": isDisabled || undefined,
				"data-value": optionValue,
				"data-state": selected ? ("selected" as const) : ("unselected" as const),
				"data-highlighted": highlightedId === optionId ? ("" as const) : undefined,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				onclick: () => { if (!isDisabled) select(optionValue); },
				onpointerenter: () => { highlightedId = optionId; },
			};
		},

		getGroup(label: string) {
			return {
				...listboxAnatomy.attrs.group,
				role: "group" as const,
				"aria-label": label,
			};
		},
	};
}
