/**
 * useToolbar — ColdLight toolbar primitive hook.
 *
 * Container with roving tabindex for toolbar items.
 * Arrow keys navigate between items, Home/End jump to first/last.
 * Parts: root (toolbar), item (parameterized).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { uid } from "../../_internal/utils/uid.js";
import { createRovingHandler } from "../../_shared/roving-focus/index.js";
import { toolbarAnatomy } from "./toolbar.anatomy.js";
import type { UseToolbarProps, UseToolbarReturn } from "./toolbar.types.js";

const ITEM_SELECTOR = '[data-slot="item"]:not([data-disabled])';

export function useToolbar(props: UseToolbarProps = {}): UseToolbarReturn {
	const id = uid("toolbar");
	const orientation = props.orientation ?? "horizontal";
	const loop = props.loop ?? true;
	const globalDisabled = $derived(props.disabled ?? false);

	let activeValue = $state<string | undefined>(undefined);

	// Shared composite-widget keyboard: Arrow/Home/End, RTL-aware.
	const handleKeydown = createRovingHandler({
		containerSelector: '[role="toolbar"]',
		itemSelector: ITEM_SELECTOR,
		orientation,
		loop,
		onFocusItem: (item) => {
			activeValue = item.dataset.value;
		},
	});

	const root = $derived({
		...toolbarAnatomy.attrs.root,
		id,
		role: "toolbar" as const,
		"aria-orientation": orientation,
		"aria-label": props.label,
		"data-orientation": orientation,
		"data-disabled": dataAttr(globalDisabled),
		// Before first interaction every item is tabindex=-1 — the toolbar
		// itself is the single tab stop and forwards focus to the first
		// enabled item (a11y audit Gap 5: keyboard-unreachable toolbar).
		tabindex: activeValue === undefined ? 0 : -1,
		onfocus: (e: FocusEvent) => {
			if (e.target !== e.currentTarget) return;
			const first = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(ITEM_SELECTOR);
			if (!first) return;
			first.focus();
			activeValue = first.dataset.value;
		},
	});

	return {
		get root() {
			return root;
		},

		getItem(value: string, options?: { disabled?: boolean; active?: boolean }) {
			const isDisabled = globalDisabled || (options?.disabled ?? false);
			const isActive = options?.active ?? activeValue === value;
			return {
				...toolbarAnatomy.attrs.item,
				tabindex: isActive ? 0 : -1,
				"data-value": value,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				"aria-disabled": disabledAttr(isDisabled),
				onkeydown: handleKeydown,
				// Pointer focus moves the roving anchor too, so Tab-out →
				// Tab-in returns to the last used item.
				onfocus: () => {
					if (!isDisabled) activeValue = value;
				},
			};
		},
	};
}
