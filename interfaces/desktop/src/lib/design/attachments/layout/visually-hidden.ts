/**
 * @file attachments/layout/visually-hidden.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category layout
 *
 * Makes an element visually hidden but accessible to screen readers.
 * Applies the standard visually-hidden CSS pattern.
 *
 * @example
 * ```svelte
 * <span {@attach visuallyHidden()}>Skip to main content</span>
 * ```
 *
 * @consumers SkipLink, form labels, ARIA live regions
 */

const HIDDEN_STYLES: Partial<CSSStyleDeclaration> = {
	position: "absolute",
	width: "1px",
	height: "1px",
	padding: "0",
	margin: "-1px",
	overflow: "hidden",
	clip: "rect(0, 0, 0, 0)",
	whiteSpace: "nowrap",
	borderWidth: "0",
};

/**
 * Visually hidden attachment.
 *
 * @param node - The element to hide visually
 */
export function visuallyHidden(node: HTMLElement): () => void {
	const saved: Record<string, string> = {};

	Object.entries(HIDDEN_STYLES).forEach(([prop, val]) => {
		saved[prop] = node.style.getPropertyValue(prop);
		node.style.setProperty(prop, val as string);
	});

	return () => {
		Object.entries(saved).forEach(([prop, val]) => {
			node.style.setProperty(prop, val);
		});
	};
}
