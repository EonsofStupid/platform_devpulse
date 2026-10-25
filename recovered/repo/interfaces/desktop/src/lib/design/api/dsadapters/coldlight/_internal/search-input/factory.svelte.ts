/**
 * @file builders/search-input/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight SearchInput builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: `role="search"`, `aria-label` (search landmark)
 * - Input: `role="searchbox"`, `aria-label`, `aria-describedby`
 * - Icon: `aria-hidden="true"` (decorative search icon)
 * - Clear: `type="button"`, `aria-label="Clear search"`
 *
 * Keyboard interaction:
 * | Key    | Action                                   |
 * |--------|------------------------------------------|
 * | Escape | Clears the search value and refocuses    |
 *
 * Data attributes:
 * | Attribute         | Values                         |
 * |-------------------|--------------------------------|
 * | `data-disabled`   | `""` (present) or absent       |
 * | `data-has-value`  | `""` (present) or absent       |
 * | `data-visible`    | `""` (present) or absent       |
 *
 * WAI-ARIA: `search` landmark + `searchbox` role.
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	extract,
	kbd,
} from "../../builders/index.js";
import type { SearchInputProps } from "./types.js";

const metadata = createBuilderMetadata("search-input", [
	"root",
	"input",
	"icon",
	"clear",
] as const);

/**
 * ColdLight SearchInput builder.
 *
 * Provides a fully accessible search input with a search landmark,
 * decorative icon, clear button, and Escape-to-clear keyboard support.
 * All ARIA semantics are managed internally — consumers spread slot
 * attributes onto their elements.
 *
 * @example
 * ```ts
 * const search = createSearchInput({ value: () => query, onClear: () => resetResults() });
 * ```
 */
export class SearchInput {
	/* Read-only props — $derived + extract (matches melt pattern) */
	#props!: SearchInputProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));

	/* Read-write state — Synced (needs get/set) */
	#value: Synced<string>;

	/**
	 * Unique IDs for each slot element of this search-input instance.
	 * Generated once at construction time via `createBuilderMetadata`.
	 */
	readonly ids: { readonly root: string; readonly input: string; readonly icon: string; readonly clear: string } = metadata.createIds();

	/**
	 * Create a new SearchInput builder instance.
	 *
	 * @param props - Configuration props. All are optional with sensible defaults.
	 */
	constructor(props: SearchInputProps = {}) {
		this.#props = props;

		this.#value = new Synced<string>({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: "",
		});
	}

	// ======================================================================
	// Reactive State
	// ======================================================================

	/** The current search value. */
	get value(): string {
		return this.#value.current;
	}

	/** Set the search value directly. */
	set value(v: string) {
		this.#value.current = v;
	}

	/** Whether the search input currently has a non-empty value. */
	get hasValue(): boolean {
		return this.value.length > 0;
	}

	// ======================================================================
	// Slot Attribute Getters
	// ======================================================================

	/**
	 * Root container attributes.
	 *
	 * Spread onto the search landmark element. Provides `role="search"`
	 * and the accessible label for the search region.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "search" as const,
			"aria-label": this.#props["aria-label"] ?? ("Search" as const),
			"data-disabled": dataAttr(this.disabled),
			"data-has-value": dataAttr(this.hasValue),
		};
	}

	/**
	 * Input element attributes.
	 *
	 * Spread onto the native `<input>` element. Provides `role="searchbox"`,
	 * `type="search"`, Escape-to-clear keyboard handling, and the
	 * `oninput` handler.
	 */
	get input() {
		return {
			[metadata.dataAttrs.input]: "",
			id: this.ids.input,
			role: "searchbox" as const,
			type: "search" as const,
			value: this.value,
			disabled: this.disabled || undefined,
			placeholder: this.#props.placeholder ?? ("Search..." as const),
			"aria-label": this.#props["aria-label"] ?? ("Search" as const),
			"aria-describedby": this.#props["aria-describedby"],
			"aria-disabled": disabledAttr(this.disabled),
			"data-disabled": dataAttr(this.disabled),

			oninput: (e: Event) => {
				const target = e.target as HTMLInputElement;
				this.#value.current = target.value;
			},

			onkeydown: (e: KeyboardEvent) => {
				if (this.disabled) return;
				if (e.key === kbd.ESCAPE && this.hasValue) {
					e.preventDefault();
					this.clearValue();
				}
			},
		};
	}

	/**
	 * Icon element attributes.
	 *
	 * Spread onto the decorative search icon. Marked as
	 * `aria-hidden="true"` since it is purely presentational.
	 */
	get icon() {
		return {
			[metadata.dataAttrs.icon]: "",
			id: this.ids.icon,
			"aria-hidden": "true" as const,
		};
	}

	/**
	 * Clear button attributes.
	 *
	 * Spread onto the clear/dismiss button. Includes `aria-label="Clear search"`
	 * and auto-disables when the input is empty or the widget is disabled.
	 * The button is hidden from tab order when there is no value to clear.
	 */
	get clear() {
		return {
			[metadata.dataAttrs.clear]: "",
			id: this.ids.clear,
			type: "button" as const,
			tabindex: this.hasValue ? (0 as const) : (-1 as const),
			"aria-label": "Clear search" as const,
			"aria-disabled": disabledAttr(this.disabled || !this.hasValue),
			"data-disabled": dataAttr(this.disabled || !this.hasValue),
			"data-visible": dataAttr(this.hasValue),

			onclick: () => {
				if (this.disabled) return;
				this.clearValue();
			},
		};
	}

	// ======================================================================
	// Programmatic Helpers
	// ======================================================================

	/**
	 * Clear the search value programmatically.
	 *
	 * Resets the value to an empty string, fires the `onClear` callback,
	 * and refocuses the input element.
	 */
	clearValue(): void {
		this.#value.current = "";
		this.#props.onClear?.();
		// Refocus the input after clearing
		const inputEl = document.getElementById(this.ids.input);
		inputEl?.focus();
	}
}

/**
 * Factory function for the SearchInput builder — preferred API.
 *
 * @param props - Optional search input configuration props.
 * @returns A new {@link SearchInput} instance.
 *
 * @example
 * ```ts
 * const search = createSearchInput({ placeholder: "Search items..." });
 * ```
 */
export function createSearchInput(props?: SearchInputProps): SearchInput {
	return new SearchInput(props);
}
