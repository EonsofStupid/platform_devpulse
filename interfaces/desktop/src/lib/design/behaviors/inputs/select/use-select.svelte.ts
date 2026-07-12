/**
 * useSelect — ColdLight select primitive hook.
 *
 * Select-only combobox. Trigger opens a listbox popup.
 * Arrow keys navigate, Enter/Space selects, Escape closes.
 * Parts: root, trigger, value, listbox, option (parameterized), label.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { useDismissLayer } from "../../_shared/dismiss-layer/index.js";
import { useEscapeLayer } from "../../_shared/escape-layer/index.js";
import { usePresence } from "../../_shared/presence/index.js";
import { useTypeahead } from "../../_shared/typeahead/index.js";
import { selectAnatomy } from "./select.anatomy.js";
import type { UseSelectProps, UseSelectReturn } from "./select.types.js";

export function useSelect(props: UseSelectProps = {}): UseSelectReturn {
	const id = uid("select");
	const listboxId = `${id}-listbox`;
	const globalDisabled = $derived(props.disabled ?? false);

	let value = $state(props.value ?? "");
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
		value = optionValue;
		props.onValueChange?.(optionValue);
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

	// APG select-only combobox: typed characters highlight the matching
	// option (active-descendant — options are never focused, so the search
	// anchors on the highlighted option, not document.activeElement).
	const typeahead = useTypeahead({
		getItems: getOptions,
		getActiveItem: () => getOptions().find((el) => el.id === highlightedId) ?? null,
		onMatch: (option) => {
			highlightedId = option.id;
			option.scrollIntoView({ block: "nearest" });
		},
	});

	/** Arrow/Home/End highlight movement. Returns true when handled. */
	function handleHighlightNav(
		e: KeyboardEvent,
		options: HTMLElement[],
		currentIndex: number,
	): boolean {
		if (e.key === kbd.ARROW_DOWN) {
			e.preventDefault();
			if (!isOpen) {
				setOpen(true);
				highlightByIndex(0);
			} else highlightByIndex(currentIndex < options.length - 1 ? currentIndex + 1 : 0);
			return true;
		}
		if (e.key === kbd.ARROW_UP) {
			e.preventDefault();
			if (!isOpen) {
				setOpen(true);
				highlightByIndex(options.length - 1);
			} else highlightByIndex(currentIndex > 0 ? currentIndex - 1 : options.length - 1);
			return true;
		}
		if (e.key === kbd.HOME) {
			e.preventDefault();
			if (isOpen) highlightByIndex(0);
			return true;
		}
		if (e.key === kbd.END) {
			e.preventDefault();
			if (isOpen) highlightByIndex(options.length - 1);
			return true;
		}
		return false;
	}

	function handleTriggerKeydown(e: KeyboardEvent): void {
		if (globalDisabled) return;
		const options = getOptions();
		const currentIndex = highlightedId ? options.findIndex((el) => el.id === highlightedId) : -1;

		if (handleHighlightNav(e, options, currentIndex)) return;

		if ((e.key === kbd.ENTER || e.key === kbd.SPACE) && isOpen && highlightedId) {
			e.preventDefault();
			const el = options.find((o) => o.id === highlightedId);
			const val = el?.dataset.value;
			if (val) selectOption(val);
		} else if (e.key === kbd.SPACE && !isOpen) {
			e.preventDefault();
			setOpen(true);
			highlightByIndex(0);
		} else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
			// Printable character: open (if closed) and typeahead-highlight.
			// The listbox mounts on open, so defer the first search a frame.
			if (!isOpen) {
				setOpen(true);
				requestAnimationFrame(() => typeahead.handleKeydown(e));
				return;
			}
			typeahead.handleKeydown(e);
		}
	}

	const root = $derived({ ...selectAnatomy.attrs.root });

	const trigger = $derived({
		...selectAnatomy.attrs.trigger,
		id,
		role: "combobox" as const,
		type: "button" as const,
		tabindex: 0 as const,
		"aria-expanded": isOpen,
		"aria-haspopup": "listbox" as const,
		"aria-activedescendant": isOpen ? (highlightedId ?? undefined) : undefined,
		"aria-controls": listboxId,
		"aria-disabled": disabledAttr(globalDisabled),
		"aria-required": props.required || undefined,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
		"data-disabled": dataAttr(globalDisabled),
		"data-placeholder": !value ? ("" as const) : undefined,
		onclick: () => {
			if (!globalDisabled) setOpen(!isOpen);
		},
		onkeydown: handleTriggerKeydown,
	});

	const valueDisplay = $derived({ ...selectAnatomy.attrs.value });

	const listbox = $derived({
		...selectAnatomy.attrs.listbox,
		id: listboxId,
		role: "listbox" as const,
	});

	const label = $derived({
		...selectAnatomy.attrs.label,
	});

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
		get value() {
			return value;
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
		get trigger() {
			return trigger;
		},
		get valueDisplay() {
			return valueDisplay;
		},
		get listbox() {
			return listbox;
		},
		get label() {
			return label;
		},
		getOption(optionValue: string, options?: { disabled?: boolean }) {
			const optionId = `${id}-option-${optionValue}`;
			const selected = value === optionValue;
			const isDisabled = globalDisabled || (options?.disabled ?? false);
			return {
				...selectAnatomy.attrs.option,
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
