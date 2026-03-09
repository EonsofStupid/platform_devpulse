/**
 * @file builders/input-group/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight InputGroup builder — Svelte 5 runes-native.
 *
 * The InputGroup builder owns all ARIA semantics and data-attribute derivation
 * for the input group pattern. Components create an InputGroup instance and
 * spread the slot getters onto the respective elements: root, prefix, input,
 * and suffix.
 *
 * ## ARIA Semantics
 *
 * - Root: `role="group"`, `aria-label` / `aria-labelledby`
 * - Prefix: presentational addon slot
 * - Input: pass-through slot for child input element
 * - Suffix: presentational addon slot
 *
 * No custom keyboard handling — this is a container only.
 *
 * ## Data Attributes
 *
 * - `data-cl-input-group-root` — builder identity (root)
 * - `data-cl-input-group-prefix` — builder identity (prefix)
 * - `data-cl-input-group-input` — builder identity (input)
 * - `data-cl-input-group-suffix` — builder identity (suffix)
 * - `data-disabled` — present (`""`) when disabled
 *
 * WAI-ARIA: `role="group"` associates the input with its addons.
 *
 * @see {@link InputGroupProps} for configuration options
 */

import {
	createBuilderMetadata,
	dataAttr,
	extract,
} from "../../builders/index.js";
import type { InputGroupProps } from "./types.js";

const metadata = createBuilderMetadata("input-group", [
	"root",
	"prefix",
	"input",
	"suffix",
] as const);

/**
 * ColdLight InputGroup builder.
 *
 * Manages ARIA attributes and data-attribute derivation for the input group
 * pattern. Provides a `role="group"` container that associates an input
 * element with leading (prefix) and trailing (suffix) addon elements.
 *
 * @example
 * ```typescript
 * const group = new InputGroup({ "aria-label": "Price input" });
 * // Spread: <div {...group.root}>
 * //   <span {...group.prefix}>$</span>
 * //   <input {...group.input} />
 * //   <span {...group.suffix}>.00</span>
 * // </div>
 * ```
 */
export class InputGroup {
	/* Read-only props — $derived + extract (matches melt pattern) */
	#props!: InputGroupProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));

	/** Unique IDs for this builder instance. */
	readonly ids: {
		readonly root: string;
		readonly prefix: string;
		readonly input: string;
		readonly suffix: string;
	} = metadata.createIds();

	/**
	 * Create a new InputGroup builder instance.
	 *
	 * @param props - Configuration options for the input group
	 */
	constructor(props: InputGroupProps = {}) {
		this.#props = props;
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root group wrapper element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-input-group-root`, `id`
	 * - ARIA: `role="group"`, `aria-label`, `aria-labelledby`
	 * - Data: `data-disabled`
	 *
	 * @example
	 * ```svelte
	 * <div {...group.root}>...</div>
	 * ```
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group" as const,
			"aria-label": this.#props["aria-label"],
			"aria-labelledby": this.#props["aria-labelledby"],
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Spread attributes for the prefix addon element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-input-group-prefix`, `id`
	 *
	 * @example
	 * ```svelte
	 * <span {...group.prefix}>$</span>
	 * ```
	 */
	get prefix() {
		return {
			[metadata.dataAttrs.prefix]: "",
			id: this.ids.prefix,
		};
	}

	/**
	 * Spread attributes for the input slot element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-input-group-input`, `id`
	 * - Data: `data-disabled`
	 *
	 * @example
	 * ```svelte
	 * <input {...group.input} />
	 * ```
	 */
	get input() {
		return {
			[metadata.dataAttrs.input]: "",
			id: this.ids.input,
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Spread attributes for the suffix addon element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-input-group-suffix`, `id`
	 *
	 * @example
	 * ```svelte
	 * <span {...group.suffix}>.00</span>
	 * ```
	 */
	get suffix() {
		return {
			[metadata.dataAttrs.suffix]: "",
			id: this.ids.suffix,
		};
	}
}

/**
 * Factory function for the InputGroup builder.
 *
 * Preferred API — matches MeltUI convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the input group
 * @returns A new {@link InputGroup} instance
 *
 * @example
 * ```typescript
 * const group = createInputGroup({ "aria-label": "Search", disabled: false });
 * ```
 */
export function createInputGroup(props?: InputGroupProps): InputGroup {
	return new InputGroup(props);
}
