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
import { getNextKey, getPrevKey, kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { toolbarAnatomy } from "./toolbar.anatomy.js";
import type { UseToolbarProps, UseToolbarReturn } from "./toolbar.types.js";

export function useToolbar(props: UseToolbarProps = {}): UseToolbarReturn {
	const id = uid("toolbar");
	const orientation = props.orientation ?? "horizontal";
	const loop = props.loop ?? true;
	const globalDisabled = $derived(props.disabled ?? false);

	let activeValue = $state<string | undefined>(undefined);

	function handleKeydown(e: KeyboardEvent): void {
		const nextKey = getNextKey("ltr", orientation);
		const prevKey = getPrevKey("ltr", orientation);

		if (![nextKey, prevKey, kbd.HOME, kbd.END].includes(e.key)) return;
		e.preventDefault();

		const target = e.currentTarget as HTMLElement;
		const toolbar = target.closest('[role="toolbar"]');
		if (!toolbar) return;

		const items = Array.from(
			toolbar.querySelectorAll<HTMLElement>('[data-slot="item"]:not([data-disabled])'),
		);
		if (items.length === 0) return;

		const currentIndex = items.indexOf(target);
		let nextIndex: number;

		if (e.key === nextKey) {
			nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : loop ? 0 : currentIndex;
		} else if (e.key === prevKey) {
			nextIndex = currentIndex > 0 ? currentIndex - 1 : loop ? items.length - 1 : currentIndex;
		} else if (e.key === kbd.HOME) {
			nextIndex = 0;
		} else {
			nextIndex = items.length - 1;
		}

		const nextItem = items[nextIndex];
		if (nextItem) {
			nextItem.focus();
			activeValue = nextItem.getAttribute("data-value") ?? undefined;
		}
	}

	const root = $derived({
		...toolbarAnatomy.attrs.root,
		id,
		role: "toolbar" as const,
		"aria-orientation": orientation,
		"aria-label": props.label,
		"data-orientation": orientation,
		"data-disabled": dataAttr(globalDisabled),
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
			};
		},
	};
}
