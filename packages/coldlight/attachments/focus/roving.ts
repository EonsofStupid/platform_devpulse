/**
 * @file attachments/focus/roving.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category focus
 *
 * Roving tabindex focus management. Arrow keys move focus between
 * focusable children. Only one child has tabindex=0 at a time.
 * Follows WAI-ARIA roving tabindex pattern.
 *
 * @example
 * ```svelte
 * <div {@attach rovingFocus(() => ({ orientation: "horizontal", loop: true }))}>
 *   <button>Tab 1</button>
 *   <button>Tab 2</button>
 *   <button>Tab 3</button>
 * </div>
 * ```
 *
 * @consumers Tabs, RadioGroup, Toolbar, Menubar
 */

export interface RovingFocusOptions {
	/** Arrow key direction */
	orientation?: "horizontal" | "vertical" | "both";
	/** Wrap from last to first */
	loop?: boolean;
}

const FOCUSABLE_CHILD = '[role="tab"], [role="radio"], [role="menuitem"], [tabindex]';

/**
 * Roving tabindex attachment.
 *
 * @param node - The container element
 * @param options - Reactive getter returning orientation + loop config
 */
export function rovingFocus(node: HTMLElement, options: () => RovingFocusOptions): () => void {
	function getItems(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_CHILD)).filter(
			(el) => !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true",
		);
	}

	function initTabindex() {
		const items = getItems();
		items.forEach((item, i) => {
			item.setAttribute("tabindex", i === 0 ? "0" : "-1");
		});
	}

	function handler(event: KeyboardEvent) {
		const { orientation = "horizontal", loop = true } = options();
		const items = getItems();
		if (items.length === 0) return;

		const current = items.indexOf(event.target as HTMLElement);
		if (current === -1) return;

		let next = -1;
		const isHorizontal = orientation === "horizontal" || orientation === "both";
		const isVertical = orientation === "vertical" || orientation === "both";

		if (event.key === "ArrowRight" && isHorizontal) {
			next = loop ? (current + 1) % items.length : Math.min(current + 1, items.length - 1);
		} else if (event.key === "ArrowLeft" && isHorizontal) {
			next = loop ? (current - 1 + items.length) % items.length : Math.max(current - 1, 0);
		} else if (event.key === "ArrowDown" && isVertical) {
			next = loop ? (current + 1) % items.length : Math.min(current + 1, items.length - 1);
		} else if (event.key === "ArrowUp" && isVertical) {
			next = loop ? (current - 1 + items.length) % items.length : Math.max(current - 1, 0);
		} else if (event.key === "Home") {
			next = 0;
		} else if (event.key === "End") {
			next = items.length - 1;
		}

		if (next !== -1 && next !== current) {
			event.preventDefault();
			items[current].setAttribute("tabindex", "-1");
			items[next].setAttribute("tabindex", "0");
			items[next].focus();
		}
	}

	initTabindex();
	node.addEventListener("keydown", handler);

	return () => {
		node.removeEventListener("keydown", handler);
	};
}
