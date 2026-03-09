/**
 * @file builders/table/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Table builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Semantic `<table>` — native table elements provide implicit ARIA roles.
 * `aria-label`, `aria-describedby` on root. `aria-sort` on head cells.
 *
 * Slots: root, header, body, row, cell, caption.
 *
 * Contract: primitives/table/contract.ts
 */

import {
	createBuilderMetadata,
	extract,
} from "../../builders/index.js";
import type { TableProps, AriaSort } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("table", [
	"root",
	"header",
	"body",
	"row",
	"cell",
	"caption",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Table builder.
 *
 * Provides ARIA-compliant attribute objects for a semantic HTML `<table>`.
 * Supports `aria-label`, `aria-labelledby`, `aria-describedby` on the root,
 * and `aria-sort` on head cells.
 *
 * @example
 * ```ts
 * const table = createTable({ label: "Users" });
 * // <table {...table.root}>
 * //   <caption {...table.caption}>Users</caption>
 * //   <thead {...table.header}>
 * //     <tr {...table.getRow()}>
 * //       <th {...table.getHeadCell("ascending")}>Name</th>
 * //     </tr>
 * //   </thead>
 * //   <tbody {...table.body}>
 * //     <tr {...table.getRow()}>
 * //       <td {...table.getCell()}>Alice</td>
 * //     </tr>
 * //   </tbody>
 * // </table>
 * ```
 */
export class Table {
	/** Unique IDs for each slot of this table instance. */
	readonly ids: Record<"root" | "header" | "body" | "row" | "cell" | "caption", string> =
		metadata.createIds();

	/* Read-only props — $derived + extract (matches melt pattern) */
	#props!: TableProps;
	readonly label = $derived(extract(this.#props.label, undefined as string | undefined));
	readonly labelledBy = $derived(extract(this.#props.labelledBy, undefined as string | undefined));
	readonly describedBy = $derived(extract(this.#props.describedBy, undefined as string | undefined));

	/**
	 * Create a new Table builder instance.
	 * @param props - Configuration options for the table.
	 */
	constructor(props: TableProps = {}) {
		this.#props = props;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/** Root `<table>` attributes. Spread onto the `<table>` element. */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "table" as const,
			"aria-label": this.label,
			"aria-labelledby": this.labelledBy,
			"aria-describedby": this.describedBy,
		};
	}

	/** `<thead>` attributes. Spread onto the `<thead>` element. */
	get header() {
		return {
			[metadata.dataAttrs.header]: "" as const,
			id: this.ids.header,
		};
	}

	/** `<tbody>` attributes. Spread onto the `<tbody>` element. */
	get body() {
		return {
			[metadata.dataAttrs.body]: "" as const,
			id: this.ids.body,
		};
	}

	/** `<caption>` attributes. Spread onto the `<caption>` element. */
	get caption() {
		return {
			[metadata.dataAttrs.caption]: "" as const,
			id: this.ids.caption,
		};
	}

	// ========================================================================
	// Helper methods
	// ========================================================================

	/**
	 * Get attributes for a `<tr>` row element.
	 * @returns Attribute object to spread onto a `<tr>`.
	 */
	getRow() {
		return {
			[metadata.dataAttrs.row]: "" as const,
		};
	}

	/**
	 * Get attributes for a `<td>` cell element.
	 * @returns Attribute object to spread onto a `<td>`.
	 */
	getCell() {
		return {
			[metadata.dataAttrs.cell]: "" as const,
		};
	}

	/**
	 * Get attributes for a `<th>` head cell element.
	 * @param sort - The sort direction for this column header.
	 * @returns Attribute object to spread onto a `<th>`.
	 */
	getHeadCell(sort?: AriaSort) {
		return {
			[metadata.dataAttrs.cell]: "" as const,
			"aria-sort": sort,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for creating a Table builder — preferred API.
 * @param props - Configuration options for the table.
 * @returns A new `Table` builder instance.
 */
export function createTable(props?: TableProps): Table {
	return new Table(props);
}
