/**
 * useComboBox — ColdLight combobox primitive hook.
 *
 * Text input + listbox popup with filtering. role=combobox on input,
 * aria-activedescendant for navigation, aria-autocomplete for filtering.
 * Parts: root, input, trigger (open button), listbox, option (parameterized), label.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

import { disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { useDismissLayer } from "../../_shared/dismiss-layer/index.js";
import { useEscapeLayer } from "../../_shared/escape-layer/index.js";
import { usePresence } from "../../_shared/presence/index.js";
import { comboboxAnatomy } from "./combobox.anatomy.js";
import type { UseComboBoxProps, UseComboBoxReturn } from "./combobox.types.js";

export function useComboBox(props: UseComboBoxProps = {}): UseComboBoxReturn {
	const id = uid("combobox");
	const listboxId = `${id}-listbox`;
	const globalDisabled = $derived(props.disabled ?? false);

	let inputValue = $state(props.inputValue ?? "");
	let selectedValue = $state(props.selectedValue ?? "");
	let isOpen = $state(props.open ?? false);
	let highlightedId = $state<string | null>(null);
	let listboxEl: HTMLElement | null = null;

	function setOpen(v: boolean): void {
		if (v === isOpen) return;
		isOpen = v;
		props.onOpenChange?.(v);
		if (!v) highlightedId = null;
	}

	function selectOption(optionValue: string): void {
		selectedValue = optionValue;
		props.onSelectedChange?.(optionValue);
		setOpen(false);
	}

	function getOptions(): HTMLElement[] {
		if (!listboxEl) return [];
		return Array.from(
			listboxEl.querySelectorAll<HTMLElement>('[role="option"]:not([data-disabled])'),
		);
	}

	function highlightByIndex(index: number): void {
		const options = getOptions();
		if (index >= 0 && index < options.length) {
			highlightedId = options[index].id;
			options[index].scrollIntoView({ block: "nearest" });
		}
	}

	function handleInputKeydown(e: KeyboardEvent): void {
		if (globalDisabled) return;
		const options = getOptions();
		const currentIndex = highlightedId ? options.findIndex((el) => el.id === highlightedId) : -1;

		if (e.key === kbd.ARROW_DOWN) {
			e.preventDefault();
			if (!isOpen) {
				setOpen(true);
				highlightByIndex(0);
			} else highlightByIndex(currentIndex < options.length - 1 ? currentIndex + 1 : 0);
		} else if (e.key === kbd.ARROW_UP) {
			e.preventDefault();
			if (isOpen) highlightByIndex(currentIndex > 0 ? currentIndex - 1 : options.length - 1);
		} else if (e.key === kbd.HOME && isOpen) {
			e.preventDefault();
			highlightByIndex(0);
		} else if (e.key === kbd.END && isOpen) {
			e.preventDefault();
			highlightByIndex(options.length - 1);
		} else if (e.key === kbd.ENTER && isOpen && highlightedId) {
			e.preventDefault();
			const el = options.find((o) => o.id === highlightedId);
			const val = el?.getAttribute("data-value");
			if (val) selectOption(val);
		}
	}

	const root = $derived({ ...comboboxAnatomy.attrs.root });

	const input = $derived({
		...comboboxAnatomy.attrs.input,
		id,
		role: "combobox" as const,
		type: "text" as const,
		value: inputValue,
		placeholder: props.placeholder,
		"aria-expanded": isOpen,
		"aria-haspopup": "listbox" as const,
		"aria-activedescendant": isOpen ? (highlightedId ?? undefined) : undefined,
		"aria-autocomplete": "list" as const,
		"aria-controls": listboxId,
		"aria-disabled": disabledAttr(globalDisabled),
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		disabled: globalDisabled || undefined,
		oninput: (e: Event) => {
			inputValue = (e.target as HTMLInputElement).value;
			props.onInputChange?.(inputValue);
			if (!isOpen) setOpen(true);
		},
		onkeydown: handleInputKeydown,
		onfocus: () => {
			if (!isOpen && inputValue) setOpen(true);
		},
	});

	const trigger = $derived({
		...comboboxAnatomy.attrs.trigger,
		type: "button" as const,
		tabindex: -1 as const,
		"aria-label": "Toggle options" as const,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		onclick: () => {
			if (!globalDisabled) setOpen(!isOpen);
		},
	});

	const listbox = $derived({
		...comboboxAnatomy.attrs.listbox,
		id: listboxId,
		role: "listbox" as const,
	});

	const label = $derived({ ...comboboxAnatomy.attrs.label });

	function attachListbox(node: HTMLElement): { destroy(): void } {
		listboxEl = node;
		useEscapeLayer({ enabled: () => isOpen, onEscape: () => setOpen(false) });
		useDismissLayer({
			enabled: () => isOpen,
			node: () => listboxEl,
			onDismiss: () => setOpen(false),
		});
		usePresence({ open: () => isOpen, node: () => listboxEl });
		return {
			destroy() {
				listboxEl = null;
			},
		};
	}

	return {
		get inputValue() {
			return inputValue;
		},
		get selectedValue() {
			return selectedValue;
		},
		get open() {
			return isOpen;
		},
		get highlightedId() {
			return highlightedId;
		},
		setOpen,
		get root() {
			return root;
		},
		get input() {
			return input;
		},
		get trigger() {
			return trigger;
		},
		get listbox() {
			return listbox;
		},
		get label() {
			return label;
		},
		getOption(optionValue: string, options?: { disabled?: boolean }) {
			const optionId = `${id}-option-${optionValue}`;
			const selected = selectedValue === optionValue;
			const isDisabled = globalDisabled || (options?.disabled ?? false);
			return {
				...comboboxAnatomy.attrs.option,
				id: optionId,
				role: "option" as const,
				"aria-selected": selected,
				"aria-disabled": isDisabled || undefined,
				"data-value": optionValue,
				"data-state": selected ? ("selected" as const) : ("unselected" as const),
				"data-highlighted": highlightedId === optionId ? ("" as const) : undefined,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				onclick: () => {
					if (!isDisabled) selectOption(optionValue);
				},
				onpointerenter: () => {
					highlightedId = optionId;
				},
			};
		},
		attachListbox,
	};
}
