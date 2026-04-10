import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes } from "svelte/elements";

/**
 * Structural props for the SkipLink primitive.
 *
 * A skip link lets keyboard users bypass repetitive navigation and jump
 * to main content. Required for WCAG 2.1 Level A. Must be the first
 * focusable element on the page. Visually hidden until focused.
 */
export interface SkipLinkPrimitiveProps extends Omit<HTMLAnchorAttributes, "children"> {
	/** Snippet content (the skip link text) */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Target element ID to skip to. Default: "#main-content" */
	href?: string;
}
