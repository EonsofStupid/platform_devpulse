import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes } from "svelte/elements";

/** Valid aria-current values for navigation links */
export type LinkCurrent = "page" | "step" | "location" | "date" | "time" | "true" | "false";

/**
 * Structural props for the Link primitive.
 *
 * A link navigates to a URL or triggers an action. Renders as `<a>` when
 * `href` is provided, otherwise as a `<span>` with `role="link"`.
 *
 * External links should include `target="_blank"` and `rel="noopener noreferrer"`.
 * Use `aria-current` in navigation contexts to indicate the active page.
 *
 * @example
 * ```svelte
 * <!-- Navigation link -->
 * <a {...linkAnatomy.attrs.root} href="/dashboard">Dashboard</a>
 *
 * <!-- Action link (no URL) -->
 * <span {...linkAnatomy.attrs.root} role="link" tabindex="0" onclick={handleClick}>
 *   View details
 * </span>
 * ```
 */
export interface LinkPrimitiveProps extends Omit<HTMLAnchorAttributes, "children"> {
	/** Snippet content rendered inside the link */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Navigation URL — when provided, renders as <a> */
	href?: string;
	/** Link target window */
	target?: string;
	/** Link relationship */
	rel?: string;
	/** Disabled state — prevents navigation/activation */
	disabled?: boolean;
	/** Indicates current page/location in navigation */
	"aria-current"?: LinkCurrent;
	/** Action handler for non-navigation links */
	onPress?: () => void;
}
