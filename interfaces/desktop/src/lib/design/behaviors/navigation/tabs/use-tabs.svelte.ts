/**
 * useTabs — ColdLight tabs primitive hook.
 *
 * Tablist with roving tabindex, arrow key navigation, optional activate-on-focus.
 * Parts: root, list (tablist), trigger (tab, parameterized), content (tabpanel, parameterized).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import { uid } from "../../_internal/utils/uid.js";
import { createRovingHandler } from "../../_shared/roving-focus/index.js";
import { tabsAnatomy } from "./tabs.anatomy.js";
import type { UseTabsProps, UseTabsReturn } from "./tabs.types.js";

export function useTabs(props: UseTabsProps = {}): UseTabsReturn {
	const id = uid("tabs");
	const orientation = props.orientation ?? "horizontal";
	const activateOnFocus = props.activateOnFocus ?? true;
	const loop = props.loop ?? true;

	let value = $state(props.value ?? "");

	function setValue(v: string): void {
		if (v === value) return;
		value = v;
		props.onValueChange?.(v);
	}

	// Shared composite-widget keyboard: Arrow/Home/End, RTL-aware.
	const handleKeydown = createRovingHandler({
		containerSelector: '[role="tablist"]',
		itemSelector: '[role="tab"]:not([data-disabled])',
		orientation,
		loop,
		onFocusItem: (tab) => {
			if (!activateOnFocus) return;
			const tabValue = tab.getAttribute("data-value");
			if (tabValue) setValue(tabValue);
		},
	});

	const root = $derived({
		...tabsAnatomy.attrs.root,
		"data-orientation": orientation,
	});

	const list = $derived({
		...tabsAnatomy.attrs.list,
		role: "tablist" as const,
		"aria-orientation": orientation,
		"data-orientation": orientation,
	});

	return {
		get value() {
			return value;
		},
		get root() {
			return root;
		},
		get list() {
			return list;
		},

		getTrigger(tabValue: string, disabled?: boolean) {
			const isSelected = tabValue === value;
			return {
				...tabsAnatomy.attrs.trigger,
				role: "tab" as const,
				type: "button" as const,
				id: `${id}-trigger-${tabValue}`,
				"aria-selected": isSelected,
				"aria-controls": `${id}-panel-${tabValue}`,
				tabindex: isSelected ? 0 : -1,
				"data-state": isSelected ? ("active" as const) : ("inactive" as const),
				"data-value": tabValue,
				"data-disabled": disabled ? ("" as const) : undefined,
				"aria-disabled": disabled || undefined,
				onclick: () => {
					if (!disabled) setValue(tabValue);
				},
				onkeydown: handleKeydown,
			};
		},

		getContent(tabValue: string) {
			const isSelected = tabValue === value;
			return {
				...tabsAnatomy.attrs.content,
				role: "tabpanel" as const,
				id: `${id}-panel-${tabValue}`,
				"aria-labelledby": `${id}-trigger-${tabValue}`,
				tabindex: 0 as const,
				hidden: !isSelected || undefined,
				"data-state": isSelected ? ("visible" as const) : ("hidden" as const),
			};
		},
	};
}
