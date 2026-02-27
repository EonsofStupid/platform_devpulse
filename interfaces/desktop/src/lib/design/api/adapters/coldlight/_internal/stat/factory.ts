/**
 * @file builders/stat/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Stat builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Display component for a single statistic: label, value, and optional help text.
 * Groups the slots semantically so assistive technology reads them as a unit.
 *
 * Slots: root, label (via `labelAttrs`), value, helptext.
 *
 * WAI-ARIA:
 * - root: `role="group"` with `aria-label` or `aria-labelledby`.
 * - label: identifies the statistic (used by `aria-labelledby` when no explicit label).
 * - value: the numeric/text value.
 * - helptext: supplementary context (e.g. trend, time period).
 *
 * Data attributes:
 * - `data-cl-stat-root`
 * - `data-cl-stat-label`
 * - `data-cl-stat-value`
 * - `data-cl-stat-helptext`
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../../builders/index.js";
import type { StatProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("stat", [
	"root",
	"label",
	"value",
	"helptext",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Stat builder.
 *
 * Provides `root`, `labelAttrs`, `value`, and `helptext` slot getters
 * for displaying a single statistic with grouped ARIA semantics.
 *
 * @example
 * ```ts
 * const stat = createStat({ label: "Revenue" });
 * // Spread stat.root, stat.labelAttrs, stat.value, stat.helptext onto elements.
 * ```
 */
export class Stat {
	// ==========================================================================
	// Instance IDs
	// ==========================================================================

	/**
	 * Unique element IDs for every slot in this builder instance.
	 *
	 * @remarks Generated once at construction via `metadata.createIds()`.
	 */
	readonly ids: {
		readonly root: string;
		readonly label: string;
		readonly value: string;
		readonly helptext: string;
	} = metadata.createIds();

	// ==========================================================================
	// Private state
	// ==========================================================================

	#label: Synced<string>;

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new Stat builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: StatProps = {}) {
		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "",
		});
	}

	// ==========================================================================
	// Reactive state
	// ==========================================================================

	/** Accessible label for the stat group. */
	get label(): string {
		return this.#label.current;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Root slot attributes.
	 *
	 * Spread onto the stat wrapper `<div>`.
	 * Provides `role="group"` with either `aria-label` (when label prop is set)
	 * or `aria-labelledby` (pointing to the label slot element),
	 * and the `data-cl-stat-root` data attribute.
	 */
	get root() {
		const label = this.label;
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "group" as const,
			...(label ? { "aria-label": label } : { "aria-labelledby": this.ids.label }),
		};
	}

	/**
	 * Label slot attributes.
	 *
	 * Spread onto the label `<span>` element.
	 * Referenced by `aria-labelledby` on root when no explicit label is provided.
	 */
	get labelAttrs() {
		return {
			[metadata.dataAttrs.label]: "" as const,
			id: this.ids.label,
		};
	}

	/**
	 * Value slot attributes.
	 *
	 * Spread onto the value `<span>` element displaying the statistic.
	 */
	get value() {
		return {
			[metadata.dataAttrs.value]: "" as const,
			id: this.ids.value,
		};
	}

	/**
	 * Helptext slot attributes.
	 *
	 * Spread onto the supplementary text `<span>` (e.g. trend, time period).
	 */
	get helptext() {
		return {
			[metadata.dataAttrs.helptext]: "" as const,
			id: this.ids.helptext,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link Stat} builder instance.
 *
 * Factory function -- preferred API over direct `new Stat()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised Stat builder.
 */
export function createStat(props?: StatProps): Stat {
	return new Stat(props);
}
