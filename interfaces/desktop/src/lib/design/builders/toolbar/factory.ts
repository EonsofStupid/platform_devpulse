/**
 * @file builders/toolbar/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Toolbar builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Root: role="toolbar", aria-orientation, aria-label.
 * Items: roving tabindex with ArrowLeft/Right (horizontal),
 * ArrowUp/Down (vertical), Home, End.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import { Synced } from "../_internal/synced.svelte.js";
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
import type { ToolbarProps } from "./types.js";

const metadata = createBuilderMetadata("toolbar", ["root", "item"] as const);

export class Toolbar {
	readonly ids = metadata.createIds();
	#label: Synced<string | undefined>;
	#orientation: Synced<Orientation>;
	#disabled: Synced<boolean>;
	#loop: Synced<boolean>;

	constructor(props: ToolbarProps = {} as ToolbarProps) {
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

	// --- Slot attribute getters ---

	/** Root container attributes. Spread onto the toolbar wrapper element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "toolbar",
			"aria-orientation": this.orientation,
			"aria-label": this.#label.current,
			"data-orientation": this.orientation,
			"data-disabled": dataAttr(this.disabled),
		};
	}

	/**
	 * Get attributes for a toolbar item.
	 * Each item returns a spread-able object with ARIA, keyboard handlers, and data attrs.
	 */
	getItem(value: string, itemDisabled?: boolean): SlotAttrs {
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

/** Factory function — preferred API. */
export function createToolbar(props?: ToolbarProps): Toolbar {
	return new Toolbar(props);
}
