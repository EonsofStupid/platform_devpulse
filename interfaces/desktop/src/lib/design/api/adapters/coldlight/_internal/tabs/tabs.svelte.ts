/**
 * @file ColdLight Tabs Implementation
 * @description Svelte 5 runes-native tabs with ARIA and roving tabindex.
 *
 * Owns all ARIA semantics: role="tablist", role="tab", role="tabpanel",
 * aria-selected, aria-controls, aria-labelledby, roving tabindex.
 *
 * Keyboard: ArrowLeft/Right (horizontal), ArrowUp/Down (vertical),
 * Home, End. Skips disabled triggers. Optional loop + activateOnFocus.
 */

import { generateId } from "../_transport/ids.js";
import { extract, type MaybeGetter, type SlotAttrs } from "../_transport/types.js";

export interface ColdLightTabsConfig {
	value?: MaybeGetter<string>;
	onValueChange?: (value: string) => void;
	orientation?: MaybeGetter<"horizontal" | "vertical">;
	activateOnFocus?: MaybeGetter<boolean>;
	loop?: MaybeGetter<boolean>;
}

export class ColdLightTabs {
	#config: ColdLightTabsConfig = {};
	#id: string;

	// --- State ---
	#value = $state("");

	// --- Derived config ---
	#orientation = $derived(extract(this.#config.orientation, "horizontal"));
	#activateOnFocus = $derived(extract(this.#config.activateOnFocus, true));
	#loop = $derived(extract(this.#config.loop, true));

	constructor(config: ColdLightTabsConfig = {}) {
		this.#config = config;
		this.#value = extract(config.value, "");
		this.#id = generateId("tabs");
	}

	// --- Value state ---
	get value(): string {
		return this.#value;
	}

	set value(v: string) {
		if (v === this.#value) return;
		this.#value = v;
		this.#config.onValueChange?.(v);
	}

	get orientation(): "horizontal" | "vertical" {
		return this.#orientation;
	}

	// --- Static slot attrs ---
	get root(): SlotAttrs {
		return {
			"data-orientation": this.#orientation,
		};
	}

	get list(): SlotAttrs {
		return {
			role: "tablist",
			"aria-orientation": this.#orientation,
			"data-orientation": this.#orientation,
		};
	}

	// --- Parameterized slot attrs ---
	getTrigger(tabValue: string, disabled?: boolean): SlotAttrs {
		const isSelected = tabValue === this.#value;
		return {
			role: "tab",
			type: "button",
			id: `${this.#id}-trigger-${tabValue}`,
			"aria-selected": isSelected,
			"aria-controls": `${this.#id}-panel-${tabValue}`,
			tabindex: isSelected ? 0 : -1,
			"data-state": isSelected ? "active" : "inactive",
			"data-value": tabValue,
			"data-disabled": disabled ? "" : undefined,
			"aria-disabled": disabled || undefined,
			onclick: () => {
				if (!disabled) this.value = tabValue;
			},
			onkeydown: (e: KeyboardEvent) => this.#handleKeydown(e),
		};
	}

	getContent(tabValue: string): SlotAttrs {
		const isSelected = tabValue === this.#value;
		return {
			role: "tabpanel",
			id: `${this.#id}-panel-${tabValue}`,
			"aria-labelledby": `${this.#id}-trigger-${tabValue}`,
			tabindex: 0,
			hidden: !isSelected || undefined,
			"data-state": isSelected ? "visible" : "hidden",
		};
	}

	// --- Keyboard navigation ---
	#handleKeydown(e: KeyboardEvent): void {
		const isHorizontal = this.#orientation === "horizontal";
		const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";
		const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";

		if (![nextKey, prevKey, "Home", "End"].includes(e.key)) return;

		e.preventDefault();

		const target = e.currentTarget as HTMLElement;
		const tablist = target.closest('[role="tablist"]');
		if (!tablist) return;

		const enabledTabs = Array.from(
			tablist.querySelectorAll('[role="tab"]:not([data-disabled])'),
		) as HTMLElement[];

		if (enabledTabs.length === 0) return;

		const currentIndex = enabledTabs.indexOf(target);
		let nextIndex: number;

		if (currentIndex === -1) {
			// Current trigger not in enabled list — jump to first enabled
			nextIndex = 0;
		} else if (e.key === nextKey) {
			nextIndex = currentIndex + 1;
			if (nextIndex >= enabledTabs.length) {
				nextIndex = this.#loop ? 0 : currentIndex;
			}
		} else if (e.key === prevKey) {
			nextIndex = currentIndex - 1;
			if (nextIndex < 0) {
				nextIndex = this.#loop ? enabledTabs.length - 1 : currentIndex;
			}
		} else if (e.key === "Home") {
			nextIndex = 0;
		} else {
			// End
			nextIndex = enabledTabs.length - 1;
		}

		const nextTab = enabledTabs[nextIndex];
		if (!nextTab) return;

		nextTab.focus();

		if (this.#activateOnFocus) {
			const tabValue = nextTab.getAttribute("data-value");
			if (tabValue) this.value = tabValue;
		}
	}
}
