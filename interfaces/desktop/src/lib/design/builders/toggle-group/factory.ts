/**
 * @file builders/toggle-group/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight ToggleGroup builder — Svelte 5 runes-native.
 *
 * The ToggleGroup builder owns all ARIA semantics, keyboard interaction, and
 * data-attribute derivation for the toggle-group pattern. Components create
 * a ToggleGroup instance, spread `builder.root` onto the group wrapper and
 * call `builder.getItem(value)` for each toggle item.
 *
 * ## ARIA Semantics
 *
 * - Root: `role="group"`, `aria-orientation`
 * - Items: `role="button"`, `aria-pressed`, roving `tabindex`
 *
 * ## Keyboard
 *
 * - **ArrowLeft / ArrowRight** — navigate items (horizontal)
 * - **ArrowUp / ArrowDown** — navigate items (vertical)
 * - **Home** — focus first item
 * - **End** — focus last item
 * - **Space / Enter** — toggle pressed state
 *
 * ## Data Attributes
 *
 * - `data-cl-toggle-group-root` — builder identity (root)
 * - `data-cl-toggle-group-item` — builder identity (item)
 * - `data-orientation` — `"horizontal"` or `"vertical"`
 * - `data-disabled` — present (`""`) when disabled
 * - `data-value` — the value string for each item
 * - `data-state` — `"on"` or `"off"` per item
 *
 * @see {@link ToggleGroupProps} for configuration options
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ WAI-ARIA APG Toolbar Pattern
 */

import { Synced } from "../_internal/synced.svelte.js";
import { SelectionState } from "../_internal/selection-state.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	extract,
	kbd,
	getNextKey,
	getPrevKey,
} from "../_internal/index.js";
import type { Orientation } from "../_internal/types.js";
import type { ToggleGroupProps } from "./types.js";

const metadata = createBuilderMetadata("toggle-group", ["root", "item"] as const);

/**
 * ColdLight ToggleGroup builder.
 *
 * Manages ARIA attributes, roving tabindex, keyboard navigation, and
 * data-state derivation for the toggle-group pattern. Supports both
 * single-select and multi-select modes via the `multiple` prop.
 *
 * @example
 * ```typescript
 * // Single selection
 * const group = new ToggleGroup({ value: "bold" });
 * // Spread: <div {...group.root}> ... <button {...group.getItem("bold")}>B</button>
 *
 * // Multiple selection
 * const multi = new ToggleGroup<true>({ multiple: true, value: ["bold", "italic"] });
 * ```
 */
export class ToggleGroup<Multiple extends boolean = false> {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string; readonly item: string } = metadata.createIds();

	#props: ToggleGroupProps<Multiple>;
	#selection: SelectionState<string, Multiple>;
	#disabled: Synced<boolean>;
	#orientation: Synced<Orientation>;
	#loop: Synced<boolean>;

	/**
	 * Create a new ToggleGroup builder instance.
	 *
	 * @param props - Configuration options for the toggle group
	 */
	constructor(props: ToggleGroupProps<Multiple> = {} as ToggleGroupProps<Multiple>) {
		this.#props = props;

		this.#selection = new SelectionState<string, Multiple>({
			value: props.value,
			onChange: props.onValueChange,
			multiple: props.multiple,
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});

		this.#orientation = new Synced<Orientation>({
			value: props.orientation,
			defaultValue: "horizontal",
		});

		this.#loop = new Synced<boolean>({
			value: props.loop,
			defaultValue: true,
		});
	}

	// =========================================================================
	// Reactive State — Read-only accessors for builder state
	// =========================================================================

	/** Whether the entire toggle group is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/** The orientation of the group for keyboard navigation. */
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
	 * Spread attributes for the root group wrapper element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-toggle-group-root`, `id`
	 * - ARIA: `role="group"`, `aria-orientation`
	 * - Data: `data-orientation`, `data-disabled`
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
			"aria-orientation": this.orientation,
			"data-orientation": this.orientation,
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Get spread attributes for a toggle item.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-toggle-group-item`, `id`
	 * - ARIA: `role="button"`, `aria-pressed`, `aria-disabled`
	 * - Data: `data-value`, `data-state`, `data-disabled`
	 * - Handlers: `onclick`, `onkeydown`
	 * - Navigation: `tabindex` (roving)
	 *
	 * @param value - The unique value identifier for this item
	 * @param itemDisabled - Whether this specific item is disabled
	 *
	 * @example
	 * ```svelte
	 * <button {...group.getItem("bold")}>B</button>
	 * <button {...group.getItem("italic", true)}>I (disabled)</button>
	 * ```
	 */
	getItem(value: string, itemDisabled?: boolean) {
		const isPressed = this.#selection.has(value);
		const isDisabled = this.disabled || (itemDisabled ?? false);

		return {
			[metadata.dataAttrs.item]: "",
			id: `${this.ids.item}-${value}`,
			"data-value": value,
			"data-state": isPressed ? "on" as const : "off" as const,
			"data-disabled": dataAttr(isDisabled),
			role: "button" as const,
			"aria-pressed": isPressed,
			"aria-disabled": disabledAttr(isDisabled),
			tabindex: this.#isRovingActive(value) ? 0 : -1,

			onclick: () => {
				if (isDisabled) return;
				this.#selection.toggle(value);
			},

			onkeydown: (e: KeyboardEvent) => {
				if (isDisabled) return;

				// Space / Enter — toggle
				if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
					e.preventDefault();
					this.#selection.toggle(value);
					return;
				}

				// Arrow navigation
				const nextKey = getNextKey("ltr", this.orientation);
				const prevKey = getPrevKey("ltr", this.orientation);
				const el = e.currentTarget as HTMLElement;
				const root = el.closest(metadata.dataSelectors.root);
				if (!root) return;

				const items = Array.from(
					root.querySelectorAll<HTMLElement>(metadata.dataSelectors.item),
				).filter((item) => !item.hasAttribute("data-disabled") || item.dataset["disabled"] === undefined);

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
		};
	}

	// =========================================================================
	// Programmatic Helpers
	// =========================================================================

	/**
	 * Check whether a given value is currently selected/pressed.
	 *
	 * @param value - The value to check
	 * @returns `true` if the value is in the current selection
	 */
	isSelected(value: string): boolean {
		return this.#selection.has(value);
	}

	/**
	 * Programmatically select/press a value.
	 *
	 * In single-select mode, replaces the current selection.
	 * In multi-select mode, adds to the selection.
	 * No-op if the group is disabled.
	 *
	 * @param value - The value to select
	 */
	select(value: string): void {
		if (this.disabled) return;
		if (!this.#selection.has(value)) {
			this.#selection.toggle(value);
		}
	}

	/**
	 * Programmatically deselect/unpress a value.
	 *
	 * No-op if the group is disabled or the value is not currently selected.
	 *
	 * @param value - The value to deselect
	 */
	deselect(value: string): void {
		if (this.disabled) return;
		if (this.#selection.has(value)) {
			this.#selection.toggle(value);
		}
	}

	// =========================================================================
	// Private
	// =========================================================================

	/**
	 * Roving tabindex: the first selected item gets tabindex=0,
	 * or all items if nothing is selected (first rendered wins).
	 */
	#isRovingActive(value: string): boolean {
		const selected = this.#selection.toArray();
		if (selected.length > 0) {
			return selected[0] === value;
		}
		// Nothing selected — first non-disabled item should be tabbable.
		// We can't know here which is "first" in DOM order, so we return true
		// for all items and let the first rendered item win naturally.
		// This matches melt's behavior for empty state.
		return true;
	}
}

/**
 * Factory function for the ToggleGroup builder.
 *
 * Preferred API — matches MeltUI convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the toggle group
 * @returns A new {@link ToggleGroup} instance
 *
 * @example
 * ```typescript
 * const group = createToggleGroup({ value: "bold", orientation: "horizontal" });
 * ```
 */
export function createToggleGroup<Multiple extends boolean = false>(
	props?: ToggleGroupProps<Multiple>,
): ToggleGroup<Multiple> {
	return new ToggleGroup(props);
}
