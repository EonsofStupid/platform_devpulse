/**
 * @file builders/nav-item/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight NavItem builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: `aria-current="page"` when active, `aria-disabled` when disabled
 *
 * Slots: root.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 */

import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	extract,
} from "../../builders/index.js";
import type { NavItemProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("nav-item", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight NavItem builder.
 *
 * Provides ARIA-compliant attribute objects for a single navigation link.
 * Supports active state (`aria-current="page"`), disabled state, and href.
 *
 * @example
 * ```ts
 * const item = createNavItem({ href: "/dashboard", active: true });
 * // <a {...item.root}>Dashboard</a>
 * ```
 */
export class NavItem {
	/* Read-only props — $derived + extract (matches melt pattern) */
	#props!: NavItemProps;
	readonly active = $derived(extract(this.#props.active, false));
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly href = $derived(extract(this.#props.href, ""));

	/** Unique IDs for each slot of this nav-item instance. */
	readonly ids: Record<"root", string> = metadata.createIds();

	/**
	 * Create a new NavItem builder instance.
	 * @param props - Configuration options for the navigation item.
	 */
	constructor(props: NavItemProps = {}) {
		this.#props = props;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/** Root element attributes. Spread onto the `<a>` element. */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			href: this.href || undefined,
			"aria-current": this.active ? ("page" as const) : undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"data-active": dataAttr(this.active),
			"data-disabled": dataAttr(this.disabled),
			tabindex: this.disabled ? -1 : undefined,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for creating a NavItem builder — preferred API.
 * @param props - Configuration options for the navigation item.
 * @returns A new `NavItem` builder instance.
 */
export function createNavItem(props?: NavItemProps): NavItem {
	return new NavItem(props);
}
