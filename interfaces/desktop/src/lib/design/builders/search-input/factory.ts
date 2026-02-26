/**
 * @file builders/search-input/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight SearchInput builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics:
 * - Root: role="search", aria-label
 * - Input: role="searchbox", aria-label, aria-describedby
 * - Icon: aria-hidden="true" (decorative)
 * - Clear: role="button", aria-label="Clear search"
 *
 * Keyboard: Escape — clears search value.
 *
 * WAI-ARIA: search landmark + searchbox role.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	kbd,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { SearchInputProps } from "./types.js";

const metadata = createBuilderMetadata("search-input", [
	"root",
	"input",
	"icon",
	"clear",
] as const);

export class SearchInput {
	#value: Synced<string>;
	#disabled: Synced<boolean>;
	#props: SearchInputProps;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: SearchInputProps = {} as SearchInputProps) {
		this.#props = props;

		this.#value = new Synced<string>({
			value: props.value,
			onChange: props.onValueChange,
			defaultValue: "",
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});
	}

	// --- Reactive state ---

	get value(): string {
		return this.#value.current;
	}

	set value(v: string) {
		this.#value.current = v;
	}

	get disabled(): boolean {
		return this.#disabled.current;
	}

	get hasValue(): boolean {
		return this.value.length > 0;
	}

	// --- Slot attribute getters ---

	/** Root container attributes. Spread onto the search landmark element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "search",
			"aria-label": this.#props["aria-label"] ?? "Search",
			"data-disabled": dataAttr(this.disabled),
			"data-has-value": dataAttr(this.hasValue),
		};
	}

	/** Input element attributes. Spread onto the native <input> element. */
	get input(): SlotAttrs {
		return {
			[metadata.dataAttrs.input]: "",
			id: this.ids.input,
			role: "searchbox",
			type: "search",
			value: this.value,
			disabled: this.disabled || undefined,
			placeholder: this.#props.placeholder ?? "Search...",
			"aria-label": this.#props["aria-label"] ?? "Search",
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

	/** Icon element attributes. Spread onto the decorative search icon. */
	get icon(): SlotAttrs {
		return {
			[metadata.dataAttrs.icon]: "",
			id: this.ids.icon,
			"aria-hidden": "true",
		};
	}

	/** Clear button attributes. Spread onto the clear/dismiss button. */
	get clear(): SlotAttrs {
		return {
			[metadata.dataAttrs.clear]: "",
			id: this.ids.clear,
			type: "button",
			tabindex: this.hasValue ? 0 : -1,
			"aria-label": "Clear search",
			"aria-disabled": disabledAttr(this.disabled || !this.hasValue),
			"data-disabled": dataAttr(this.disabled || !this.hasValue),
			"data-visible": dataAttr(this.hasValue),

			onclick: () => {
				if (this.disabled) return;
				this.clearValue();
			},
		};
	}

	/** Clear the search value programmatically. */
	clearValue(): void {
		this.#value.current = "";
		this.#props.onClear?.();
		// Refocus the input after clearing
		const inputEl = document.getElementById(this.ids.input);
		inputEl?.focus();
	}
}

/** Factory function — preferred API. */
export function createSearchInput(props?: SearchInputProps): SearchInput {
	return new SearchInput(props);
}
