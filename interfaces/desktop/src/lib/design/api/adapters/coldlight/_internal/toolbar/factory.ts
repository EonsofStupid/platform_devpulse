/**
 * @file builders/toolbar/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Toolbar builder — Svelte 5 runes-native.
 *
 * The Toolbar builder owns all ARIA semantics, keyboard interaction, and
 * data-attribute derivation for the toolbar pattern. Components create
 * a Toolbar instance, spread `builder.root` onto the toolbar wrapper and
 * call `builder.getItem(value)` for each toolbar item.
 *
 * ## ARIA Semantics
 *
 * - Root: `role="toolbar"`, `aria-orientation`, `aria-label`
 * - Items: roving `tabindex` with keyboard navigation
 *
 * ## Keyboard
 *
 * - **ArrowLeft / ArrowRight** — navigate items (horizontal)
 * - **ArrowUp / ArrowDown** — navigate items (vertical)
 * - **Home** — focus first item
 * - **End** — focus last item
 *
 * ## Data Attributes
 *
 * - `data-cl-toolbar-root` — builder identity (root)
 * - `data-cl-toolbar-item` — builder identity (item)
 * - `data-orientation` — `"horizontal"` or `"vertical"`
 * - `data-disabled` — present (`""`) when disabled
 * - `data-value` — the value string for each item
 *
 * @see {@link ToolbarProps} for configuration options
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ WAI-ARIA APG Toolbar Pattern
 */

import { Synced } from "../../../../../builders/_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	kbd,
	getNextKey,
	getPrevKey,
} from "../../../../../builders/_internal/index.js";
import type { Orientation } from "../../../../../builders/_internal/types.js";
import type { ToolbarProps } from "./types.js";

const metadata = createBuilderMetadata("toolbar", ["root", "item"] as const);

/**
 * ColdLight Toolbar builder.
 *
 * Manages ARIA attributes, roving tabindex, keyboard navigation, and
 * data-attribute derivation for the toolbar pattern. Provides a container
 * with arrow-key navigation between toolbar items.
 *
 * @example
 * ```typescript
 * const toolbar = new Toolbar({ label: "Formatting", orientation: "horizontal" });
 * // Spread: <div {...toolbar.root}> ... <button {...toolbar.getItem("bold")}>B</button>
 * ```
 */
export class Toolbar {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string; readonly item: string } = metadata.createIds();

	#label: Synced<string | undefined>;
	#orientation: Synced<Orientation>;
	#disabled: Synced<boolean>;
	#loop: Synced<boolean>;

	/**
	 * Create a new Toolbar builder instance.
	 *
	 * @param props - Configuration options for the toolbar
	 */
	constructor(props: ToolbarProps = {}) {
		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});

		this.#orientation = new Synced<Orientation>({
			value: props.orientation,
			defaultValue: "horizontal",
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});

		this.#loop = new Synced<boolean>({
			value: props.loop,
			defaultValue: true,
		});
	}

	// =========================================================================
	// Reactive State — Read-only accessors for builder state
	// =========================================================================

	/** Whether the entire toolbar is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/** The orientation of the toolbar for keyboard navigation. */
	get orientation(): Orientation {
		return this.#orientation.current;
	}

	/** Whether arrow key navigation loops at boundaries. */
	get loop(): boolean {
		return this.#loop.current;
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root toolbar wrapper element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-toolbar-root`, `id`
	 * - ARIA: `role="toolbar"`, `aria-orientation`, `aria-label`
	 * - Data: `data-orientation`, `data-disabled`
	 *
	 * @example
	 * ```svelte
	 * <div {...toolbar.root}>...</div>
	 * ```
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "toolbar" as const,
			"aria-orientation": this.orientation,
			"aria-label": this.#label.current,
			"data-orientation": this.orientation,
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Get spread attributes for a toolbar item.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-toolbar-item`, `id`
	 * - ARIA: `aria-disabled`
	 * - Data: `data-value`, `data-disabled`
	 * - Handlers: `onclick`, `onkeydown`, `onfocus`
	 * - Navigation: `tabindex` (roving, managed via `onfocus`)
	 *
	 * @param value - The unique value identifier for this item
	 * @param itemDisabled - Whether this specific item is disabled
	 *
	 * @example
	 * ```svelte
	 * <button {...toolbar.getItem("bold")}>B</button>
	 * <button {...toolbar.getItem("italic", true)}>I (disabled)</button>
	 * ```
	 */
	getItem(value: string, itemDisabled?: boolean) {
		const isDisabled = this.disabled || (itemDisabled ?? false);

		return {
			[metadata.dataAttrs.item]: "",
			id: `${this.ids.item}-${value}`,
			"data-value": value,
			"data-disabled": dataAttr(isDisabled),
			"aria-disabled": disabledAttr(isDisabled),
			tabindex: -1,

			onclick: () => {
				if (isDisabled) return;
			},

			onkeydown: (e: KeyboardEvent) => {
				if (isDisabled) return;

				const nextKey = getNextKey("ltr", this.orientation);
				const prevKey = getPrevKey("ltr", this.orientation);
				const el = e.currentTarget as HTMLElement;
				const root = el.closest(metadata.dataSelectors.root);
				if (!root) return;

				const items = Array.from(
					root.querySelectorAll<HTMLElement>(metadata.dataSelectors.item),
				).filter((item) => item.dataset["disabled"] === undefined);

				const currentIdx = items.indexOf(el);
				if (currentIdx === -1) return;

				let nextIdx: number | undefined;

				if (e.key === nextKey) {
					e.preventDefault();
					nextIdx = currentIdx + 1;
					if (nextIdx >= items.length) {
						nextIdx = this.loop ? 0 : undefined;
					}
				} else if (e.key === prevKey) {
					e.preventDefault();
					nextIdx = currentIdx - 1;
					if (nextIdx < 0) {
						nextIdx = this.loop ? items.length - 1 : undefined;
					}
				} else if (e.key === kbd.HOME) {
					e.preventDefault();
					nextIdx = 0;
				} else if (e.key === kbd.END) {
					e.preventDefault();
					nextIdx = items.length - 1;
				}

				if (nextIdx !== undefined && items[nextIdx]) {
					items[nextIdx].focus();
				}
			},

			onfocus: (e: FocusEvent) => {
				// Set this item as roving target on focus
				const el = e.currentTarget as HTMLElement;
				const root = el.closest(metadata.dataSelectors.root);
				if (!root) return;

				const items = Array.from(
					root.querySelectorAll<HTMLElement>(metadata.dataSelectors.item),
				);
				items.forEach((item) => {
					item.setAttribute("tabindex", item === el ? "0" : "-1");
				});
			},
		};
	}
}

/**
 * Factory function for the Toolbar builder.
 *
 * Preferred API — matches MeltUI convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the toolbar
 * @returns A new {@link Toolbar} instance
 *
 * @example
 * ```typescript
 * const toolbar = createToolbar({ label: "Text formatting" });
 * ```
 */
export function createToolbar(props?: ToolbarProps): Toolbar {
	return new Toolbar(props);
}
