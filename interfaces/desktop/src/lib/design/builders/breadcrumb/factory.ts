/**
 * @file builders/breadcrumb/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Breadcrumb builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: <nav> with role="navigation", aria-label="Breadcrumb"
 * - List: <ol> for ordered breadcrumb list
 * - Item: <li> list item
 * - Separator: aria-hidden presentational separator
 * - Link: aria-current="page" on the last (current) item
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { BreadcrumbProps } from "./types.js";

const metadata = createBuilderMetadata("breadcrumb", ["root", "list", "item", "separator", "link"] as const);

export class Breadcrumb {
	#label: Synced<string>;
	#separator: Synced<string>;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: BreadcrumbProps = {}) {
		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "Breadcrumb",
		});

		this.#separator = new Synced<string>({
			value: props.separator,
			defaultValue: "/",
		});
	}

	// --- Reactive state ---

	get label(): string {
		return this.#label.current;
	}

	get separator(): string {
		return this.#separator.current;
	}

	// --- Element attribute getters ---

	/** Root <nav> attributes. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "navigation",
			"aria-label": this.label,
		};
	}

	/** Ordered list attributes. Spread onto <ol>. */
	get list(): SlotAttrs {
		return {
			[metadata.dataAttrs.list]: "",
			id: this.ids.list,
		};
	}

	/** List item attributes. Spread onto each <li>. */
	get item(): SlotAttrs {
		return {
			[metadata.dataAttrs.item]: "",
		};
	}

	/** Separator attributes. Spread onto the separator element. */
	get separatorAttrs(): SlotAttrs {
		return {
			[metadata.dataAttrs.separator]: "",
			role: "presentation",
			"aria-hidden": true,
		};
	}

	/**
	 * Get link attributes for a breadcrumb link.
	 * @param isCurrent - Whether this link represents the current page (last item).
	 */
	getLink(isCurrent: boolean): SlotAttrs {
		return {
			[metadata.dataAttrs.link]: "",
			"aria-current": isCurrent ? "page" : undefined,
			"data-current": isCurrent ? "" : undefined,
		};
	}
}

/** Factory function -- preferred API. */
export function createBreadcrumb(props?: BreadcrumbProps): Breadcrumb {
	return new Breadcrumb(props);
}
