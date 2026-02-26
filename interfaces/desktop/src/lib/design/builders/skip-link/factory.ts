/**
 * @file builders/skip-link/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight SkipLink builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Visually hidden link that becomes visible on focus.
 * Focus management to skip to main content.
 *
 * - Root: <a> with href pointing to target, visible only on focus
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { SkipLinkProps } from "./types.js";

const metadata = createBuilderMetadata("skip-link", ["root"] as const);

export class SkipLink {
	#href: Synced<string>;
	#label: Synced<string>;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: SkipLinkProps = {}) {
		this.#href = new Synced<string>({
			value: props.href,
			defaultValue: "#main-content",
		});

		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "Skip to main content",
		});
	}

	// --- Reactive state ---

	get href(): string {
		return this.#href.current;
	}

	get label(): string {
		return this.#label.current;
	}

	// --- Element attribute getters ---

	/** Root <a> attributes. Spread onto the skip link element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			href: this.href,
			"aria-label": this.label,

			onclick: (e: MouseEvent) => {
				const href = this.href;
				if (!href.startsWith("#")) return;
				const targetId = href.slice(1);
				const target = document.getElementById(targetId);
				if (target) {
					e.preventDefault();
					target.setAttribute("tabindex", "-1");
					target.focus();
					target.removeAttribute("tabindex");
				}
			},
		};
	}
}

/** Factory function -- preferred API. */
export function createSkipLink(props?: SkipLinkProps): SkipLink {
	return new SkipLink(props);
}
