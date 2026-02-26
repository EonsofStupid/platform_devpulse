/**
 * @file builders/table/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Table builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Semantic <table> — native table elements provide implicit ARIA roles.
 * aria-label, aria-describedby on root. aria-sort on head cells.
 *
 * Contract: primitives/table/contract.ts
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { TableProps, AriaSort } from "./types.js";

const metadata = createBuilderMetadata("table", [
	"root",
	"header",
	"body",
	"row",
	"cell",
	"caption",
] as const);

export class Table {
	readonly ids = metadata.createIds();

	#label: Synced<string | undefined>;
	#labelledBy: Synced<string | undefined>;
	#describedBy: Synced<string | undefined>;

	constructor(props: TableProps = {}) {
		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});
		this.#labelledBy = new Synced<string | undefined>({
			value: props.labelledBy,
			defaultValue: undefined,
		});
		this.#describedBy = new Synced<string | undefined>({
			value: props.describedBy,
			defaultValue: undefined,
		});
	}

	// --- Reactive state ---

	get label(): string | undefined {
		return this.#label.current;
	}

	get labelledBy(): string | undefined {
		return this.#labelledBy.current;
	}

	get describedBy(): string | undefined {
		return this.#describedBy.current;
	}

	// --- Element attribute getters ---

	/** Root <table> attributes. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "table",
			"aria-label": this.label,
			"aria-labelledby": this.labelledBy,
			"aria-describedby": this.describedBy,
		};
	}

	/** <thead> attributes. */
	get header(): SlotAttrs {
		return {
			[metadata.dataAttrs.header]: "",
			id: this.ids.header,
		};
	}

	/** <tbody> attributes. */
	get body(): SlotAttrs {
		return {
			[metadata.dataAttrs.body]: "",
			id: this.ids.body,
		};
	}

	/** <caption> attributes. */
	get caption(): SlotAttrs {
		return {
			[metadata.dataAttrs.caption]: "",
			id: this.ids.caption,
		};
	}

	/** Get attributes for a <tr> row. */
	getRow(): SlotAttrs {
		return {
			[metadata.dataAttrs.row]: "",
		};
	}

	/** Get attributes for a <td> cell. */
	getCell(): SlotAttrs {
		return {
			[metadata.dataAttrs.cell]: "",
		};
	}

	/** Get attributes for a <th> head cell. */
	getHeadCell(sort?: AriaSort): SlotAttrs {
		return {
			[metadata.dataAttrs.cell]: "",
			"aria-sort": sort,
		};
	}
}

/** Factory function — preferred API. */
export function createTable(props?: TableProps): Table {
	return new Table(props);
}
