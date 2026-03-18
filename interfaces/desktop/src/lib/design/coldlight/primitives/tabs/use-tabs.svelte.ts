/**
 * useTabs — ColdLight tabs primitive hook.
 *
 * Tablist with roving tabindex, arrow key navigation, optional activate-on-focus.
 * Parts: root, list (tablist), trigger (tab, parameterized), content (tabpanel, parameterized).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import { uid } from "../../_internal/utils/uid.js";
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

	function handleKeydown(e: KeyboardEvent): void {
		const isHorizontal = orientation === "horizontal";
		const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";
		const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";

		if (![nextKey, prevKey, "Home", "End"].includes(e.key)) return;
		e.preventDefault();

		const target = e.currentTarget as HTMLElement;
		const tablist = target.closest('[role="tablist"]');
		if (!tablist) return;

		const enabledTabs = Array.from(
			tablist.querySelectorAll<HTMLElement>('[role="tab"]:not([data-disabled])'),
		);
		if (enabledTabs.length === 0) return;

		const currentIndex = enabledTabs.indexOf(target);
		let nextIndex: number;

		if (currentIndex === -1) {
			nextIndex = 0;
		} else if (e.key === nextKey) {
			nextIndex = currentIndex + 1;
			if (nextIndex >= enabledTabs.length) nextIndex = loop ? 0 : currentIndex;
		} else if (e.key === prevKey) {
			nextIndex = currentIndex - 1;
			if (nextIndex < 0) nextIndex = loop ? enabledTabs.length - 1 : currentIndex;
		} else if (e.key === "Home") {
			nextIndex = 0;
		} else {
			nextIndex = enabledTabs.length - 1;
		}

		const nextTab = enabledTabs[nextIndex];
		if (!nextTab) return;

		nextTab.focus();

		if (activateOnFocus) {
			const tabValue = nextTab.getAttribute("data-value");
			if (tabValue) setValue(tabValue);
		}
	}

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
