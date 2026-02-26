/**
 * @file builders/table-of-contents/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight TableOfContents builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: <nav> with aria-label="Table of contents"
 * - List: <ul>/<ol> for heading list
 * - Item: <li> with active state tracking
 *
 * WAI-ARIA: navigation landmark pattern.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { TableOfContentsProps } from "./types.js";

const metadata = createBuilderMetadata("table-of-contents", ["root", "list", "item"] as const);

export class TableOfContents {
	#label: Synced<string>;
	#activeId: Synced<string | undefined>;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: TableOfContentsProps = {}) {
		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "Table of contents",
		});

		this.#activeId = new Synced<string | undefined>({
			value: props.activeId,
			onChange: props.onActiveIdChange,
			defaultValue: undefined,
		});
	}

	// --- Reactive state ---

	get label(): string {
		return this.#label.current;
	}

	get activeId(): string | undefined {
		return this.#activeId.current;
	}

	set activeId(id: string | undefined) {
		this.#activeId.current = id;
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

	/** List attributes. Spread onto <ul> or <ol>. */
	get list(): SlotAttrs {
		return {
			[metadata.dataAttrs.list]: "",
			id: this.ids.list,
		};
	}

	/**
	 * Get item attributes for a ToC entry.
	 * @param headingId - The ID of the heading this item links to.
	 */
	getItem(headingId: string): SlotAttrs {
		const isActive = this.activeId === headingId;
		return {
			[metadata.dataAttrs.item]: "",
			"data-active": dataAttr(isActive),
			"aria-current": isActive ? "location" : undefined,
		};
	}
}

/** Factory function -- preferred API. */
export function createTableOfContents(props?: TableOfContentsProps): TableOfContents {
	return new TableOfContents(props);
}
