/**
 * useTooltip — ColdLight tooltip primitive hook.
 *
 * Hover/focus-triggered descriptive overlay. role=tooltip + aria-describedby.
 * Shows after openDelay, hides after closeDelay. Escape dismisses immediately.
 * Parts: trigger, content.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import { uid } from "../_internal/utils/uid.js";
import { tooltipAnatomy } from "./tooltip.anatomy.js";
import type { UseTooltipProps, UseTooltipReturn } from "./tooltip.types.js";

export function useTooltip(props: UseTooltipProps = {}): UseTooltipReturn {
	const contentId = uid("tooltip");
	const openDelay = props.openDelay ?? 700;
	const closeDelay = props.closeDelay ?? 300;

	let isOpen = $state(false);
	let openTimer: ReturnType<typeof setTimeout> | null = null;
	let closeTimer: ReturnType<typeof setTimeout> | null = null;

	function show(): void {
		if (closeTimer) {
			clearTimeout(closeTimer);
			closeTimer = null;
		}
		if (isOpen) return;
		openTimer = setTimeout(() => {
			isOpen = true;
			openTimer = null;
		}, openDelay);
	}

	function hide(): void {
		if (openTimer) {
			clearTimeout(openTimer);
			openTimer = null;
		}
		if (!isOpen) return;
		closeTimer = setTimeout(() => {
			isOpen = false;
			closeTimer = null;
		}, closeDelay);
	}

	function hideImmediate(): void {
		if (openTimer) {
			clearTimeout(openTimer);
			openTimer = null;
		}
		if (closeTimer) {
			clearTimeout(closeTimer);
			closeTimer = null;
		}
		isOpen = false;
	}

	const trigger = $derived({
		...tooltipAnatomy.attrs.trigger,
		"aria-describedby": isOpen ? contentId : undefined,
		onpointerenter: () => show(),
		onpointerleave: () => hide(),
		onfocus: () => show(),
		onblur: () => hide(),
		onkeydown: (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				e.preventDefault();
				hideImmediate();
			}
		},
	});

	const content = $derived({
		...tooltipAnatomy.attrs.content,
		id: contentId,
		role: "tooltip" as const,
		"data-state": isOpen ? ("open" as const) : ("closed" as const),
	});

	return {
		get open() {
			return isOpen;
		},
		get trigger() {
			return trigger;
		},
		get content() {
			return content;
		},
	};
}
