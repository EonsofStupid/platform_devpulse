/**
 * @file builders/nav-item/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight NavItem builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: aria-current="page" when active, aria-disabled when disabled
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { NavItemProps } from "./types.js";

const metadata = createBuilderMetadata("nav-item", ["root"] as const);

export class NavItem {
	#active: Synced<boolean>;
	#disabled: Synced<boolean>;
	#href: Synced<string>;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: NavItemProps = {}) {
		this.#active = new Synced<boolean>({
			value: props.active,
			defaultValue: false,
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});

		this.#href = new Synced<string>({
			value: props.href,
			defaultValue: "",
		});
	}

	// --- Reactive state ---

	get active(): boolean {
		return this.#active.current;
	}

	get disabled(): boolean {
		return this.#disabled.current;
	}

	get href(): string {
		return this.#href.current;
	}

	// --- Element attribute getters ---

	/** Root element attributes. Spread onto the <a> element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			href: this.href || undefined,
			"aria-current": this.active ? "page" : undefined,
			"aria-disabled": disabledAttr(this.disabled),
			"data-active": dataAttr(this.active),
			"data-disabled": dataAttr(this.disabled),
			tabindex: this.disabled ? -1 : undefined,
		};
	}
}

/** Factory function -- preferred API. */
export function createNavItem(props?: NavItemProps): NavItem {
	return new NavItem(props);
}
