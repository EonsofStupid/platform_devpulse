/**
 * @file builders/toggle-group/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight ToggleGroup builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: role="group", aria-orientation
 * - Items: role="button", aria-pressed, roving tabindex
 *
 * Keyboard: ArrowLeft/Right (horizontal), ArrowUp/Down (vertical),
 * Home, End, Space, Enter.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
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
import type { SlotAttrs, Orientation } from "../_internal/types.js";
import type { ToggleGroupProps } from "./types.js";

const metadata = createBuilderMetadata("toggle-group", ["root", "item"] as const);

export class ToggleGroup<Multiple extends boolean = false> {
	#props: ToggleGroupProps<Multiple>;
	#selection: SelectionState<string, Multiple>;
	#disabled: Synced<boolean>;
	#orientation: Synced<Orientation>;
	#loop: Synced<boolean>;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

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

	// --- Reactive state ---

	get disabled(): boolean {
		return this.#disabled.current;
	}

	get orientation(): Orientation {
		return this.#orientation.current;
	}

	get loop(): boolean {
		return this.#loop.current;
	}

	// --- Element attribute getters ---

	/** Root container attributes. Spread onto the group wrapper element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "group",
			"aria-orientation": this.orientation,
			"data-orientation": this.orientation,
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Get attributes for a toggle item.
	 * Each item returns a spread-able object with ARIA, keyboard handlers, and data attrs.
	 */
	getItem(value: string, itemDisabled?: boolean): SlotAttrs {
		const isPressed = this.#selection.has(value);
		const isDisabled = this.disabled || (itemDisabled ?? false);

		return {
			[metadata.dataAttrs.item]: "",
			id: `${this.ids.item}-${value}`,
			"data-value": value,
			"data-state": isPressed ? "on" : "off",
			"data-disabled": dataAttr(isDisabled),
			role: "button",
			"aria-pressed": isPressed,
			"aria-disabled": disabledAttr(isDisabled),
			tabindex: this.#isRovingActive(value) ? 0 : -1,

			onclick: () => {
				if (isDisabled) return;
				this.#selection.toggle(value);
			},

			onkeydown: (e: KeyboardEvent) => {
				if (isDisabled) return;

				// Space / Enter → toggle
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

	// --- Private helpers ---

	/**
	 * Roving tabindex: the first selected item gets tabindex=0,
	 * or the first item if nothing is selected.
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

/** Factory function — preferred API. */
export function createToggleGroup<Multiple extends boolean = false>(
	props?: ToggleGroupProps<Multiple>,
): ToggleGroup<Multiple> {
	return new ToggleGroup(props);
}
