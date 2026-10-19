/**
 * @file attachments/aria/link.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category aria
 *
 * Auto-wires ARIA relationship attributes between elements.
 * Finds a target element (by selector or data-slot), ensures it has an ID,
 * and sets the appropriate aria-* attribute to reference that ID.
 *
 * @example
 * ```svelte
 * <div {@attach ariaLink(() => ({ type: "labelledby", targetSlot: "title" }))}>
 *   <h2 data-slot="title">Dialog Title</h2>
 *   <p>Content that is labelled by the title above.</p>
 * </div>
 * ```
 *
 * @consumers Dialog (title↔content), Form (label↔input), Tooltip (trigger↔content)
 */

export type AriaLinkType =
	| "labelledby"
	| "describedby"
	| "controls"
	| "owns"
	| "activedescendant"
	| "flowto"
	| "details"
	| "errormessage";

export interface AriaLinkOptions {
	type: AriaLinkType;
	target?: string;
	targetSlot?: string;
	scope?: "parent" | "sibling" | "document";
}

let idCounter = 0;

function generateId(type: AriaLinkType): string {
	return `cl-${type}-${++idCounter}`;
}

function findTarget(node: HTMLElement, opts: AriaLinkOptions): HTMLElement | null {
	const { target, targetSlot, scope = "parent" } = opts;

	const selector = target ?? (targetSlot ? `[data-slot="${targetSlot}"]` : null);
	if (!selector) return null;

	switch (scope) {
		case "parent": {
			const compound = node.closest("[data-kind]");
			return compound?.querySelector(selector) ?? document.querySelector(selector);
		}
		case "sibling": {
			return node.parentElement?.querySelector(selector) ?? null;
		}
		case "document": {
			return document.querySelector(selector);
		}
		default:
			return null;
	}
}

/**
 * ARIA link attachment.
 *
 * @param node - The element to set the aria-* attribute on
 * @param options - Reactive getter returning link type and target
 */
export function ariaLink(node: HTMLElement, options: () => AriaLinkOptions): () => void {
	const opts = options();
	const { type } = opts;

	// Delay to ensure DOM is ready
	queueMicrotask(() => {
		const targetEl = findTarget(node, opts);
		if (targetEl) {
			if (!targetEl.id) {
				targetEl.id = generateId(type);
			}
			node.setAttribute(`aria-${type}`, targetEl.id);
		}
	});

	return () => {
		node.removeAttribute(`aria-${type}`);
	};
}
