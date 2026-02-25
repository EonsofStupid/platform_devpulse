/**
 * @file api/adapters/coldlight/_internal/menu/menu.svelte.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Menu — Svelte 5 runes-native menu with full WAI-ARIA.
 *
 * Owns all ARIA semantics: role="menu", role="menuitem",
 * role="menuitemcheckbox", role="menuitemradio", role="separator",
 * roving tabindex, typeahead, Home/End/Escape.
 *
 * This is the shared base for DropdownMenu and ContextMenu.
 * It does NOT manage open/close state or triggers — those are
 * handled by the consuming wrapper (DropdownMenu or ContextMenu).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import { generateId } from "../_transport/ids.js";
import { extract, type MaybeGetter, type SlotAttrs } from "../_transport/types.js";
import type { MenuItemMeta } from "./_transport/types.js";

export interface ColdLightMenuConfig {
	/** Menu orientation. @default "vertical" */
	orientation?: MaybeGetter<"horizontal" | "vertical">;
	/** Whether arrow keys loop around. @default true */
	loop?: MaybeGetter<boolean>;
	/** Typeahead timeout in ms. @default 500 */
	typeaheadTimeout?: MaybeGetter<number>;
	/** Called when Escape is pressed inside the menu. */
	onClose?: () => void;
}

export class ColdLightMenu {
	#config: ColdLightMenuConfig = {};
	#id: string;

	// --- Derived config ---
	#orientation = $derived(extract(this.#config.orientation, "vertical"));
	#loop = $derived(extract(this.#config.loop, true));
	#typeaheadTimeout = $derived(extract(this.#config.typeaheadTimeout, 500));

	// --- Typeahead state ---
	#typeaheadSearch = $state("");
	#typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(config: ColdLightMenuConfig = {}) {
		this.#config = config;
		this.#id = generateId("menu");
	}

	get id(): string {
		return this.#id;
	}

	get orientation(): "horizontal" | "vertical" {
		return this.#orientation;
	}

	// --- Static slot: menu container ---
	get content(): SlotAttrs {
		return {
			id: this.#id,
			role: "menu",
			"aria-orientation": this.#orientation,
			"data-orientation": this.#orientation,
			tabindex: -1,
			onkeydown: (e: KeyboardEvent) => this.#handleKeydown(e),
		};
	}

	/** Slot: group label (for grouping menu items). */
	getGroup(label: string): SlotAttrs {
		return {
			role: "group",
			"aria-label": label,
		};
	}

	/** Slot: separator between groups. */
	get separator(): SlotAttrs {
		return {
			role: "separator",
			"aria-orientation": this.#orientation === "vertical" ? "horizontal" : "vertical",
		};
	}

	// --- Parameterized slot: menuitem ---
	getItem(meta: MenuItemMeta): SlotAttrs {
		const isCheckbox = meta.checked !== undefined;
		const isRadio = meta.radioGroup !== undefined;

		let role: string;
		if (isCheckbox) role = "menuitemcheckbox";
		else if (isRadio) role = "menuitemradio";
		else role = "menuitem";

		const attrs: SlotAttrs = {
			role,
			id: `${this.#id}-item-${meta.value}`,
			tabindex: -1,
			"data-value": meta.value,
			"data-disabled": meta.disabled ? "" : undefined,
			"aria-disabled": meta.disabled || undefined,
		};

		if (isCheckbox) {
			attrs["aria-checked"] = meta.checked;
		}
		if (isRadio) {
			attrs["aria-checked"] = meta.radioChecked;
		}

		return attrs;
	}

	// --- Keyboard handling ---
	#handleKeydown(e: KeyboardEvent): void {
		const isVertical = this.#orientation === "vertical";
		const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
		const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";

		switch (e.key) {
			case nextKey:
				e.preventDefault();
				this.#focusItem("next", e.currentTarget as HTMLElement);
				break;
			case prevKey:
				e.preventDefault();
				this.#focusItem("prev", e.currentTarget as HTMLElement);
				break;
			case "Home":
				e.preventDefault();
				this.#focusItem("first", e.currentTarget as HTMLElement);
				break;
			case "End":
				e.preventDefault();
				this.#focusItem("last", e.currentTarget as HTMLElement);
				break;
			case "Escape":
				e.preventDefault();
				e.stopPropagation();
				this.#config.onClose?.();
				break;
			case "Enter":
			case " ":
				e.preventDefault();
				this.#activateFocusedItem(e.currentTarget as HTMLElement);
				break;
			default:
				// Typeahead — single printable character
				if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
					this.#handleTypeahead(e.key, e.currentTarget as HTMLElement);
				}
				break;
		}
	}

	/** Focus next/prev/first/last enabled menuitem. */
	#focusItem(direction: "next" | "prev" | "first" | "last", menuEl: HTMLElement): void {
		const items = this.#getEnabledItems(menuEl);
		if (items.length === 0) return;

		const activeEl = document.activeElement as HTMLElement | null;
		const currentIndex = activeEl ? items.indexOf(activeEl) : -1;

		let nextIndex: number;

		switch (direction) {
			case "first":
				nextIndex = 0;
				break;
			case "last":
				nextIndex = items.length - 1;
				break;
			case "next":
				if (currentIndex === -1) {
					nextIndex = 0;
				} else {
					nextIndex = currentIndex + 1;
					if (nextIndex >= items.length) {
						nextIndex = this.#loop ? 0 : currentIndex;
					}
				}
				break;
			case "prev":
				if (currentIndex === -1) {
					nextIndex = items.length - 1;
				} else {
					nextIndex = currentIndex - 1;
					if (nextIndex < 0) {
						nextIndex = this.#loop ? items.length - 1 : currentIndex;
					}
				}
				break;
		}

		items[nextIndex]?.focus();
	}

	/** Typeahead: focus item whose text starts with typed string. */
	#handleTypeahead(char: string, menuEl: HTMLElement): void {
		if (this.#typeaheadTimer) clearTimeout(this.#typeaheadTimer);

		this.#typeaheadSearch += char.toLowerCase();

		this.#typeaheadTimer = setTimeout(() => {
			this.#typeaheadSearch = "";
			this.#typeaheadTimer = null;
		}, this.#typeaheadTimeout);

		const items = this.#getEnabledItems(menuEl);
		const match = items.find((item) =>
			(item.textContent ?? "").trim().toLowerCase().startsWith(this.#typeaheadSearch)
		);

		match?.focus();
	}

	/** Activate (click) the currently focused menuitem. */
	#activateFocusedItem(menuEl: HTMLElement): void {
		const activeEl = document.activeElement as HTMLElement | null;
		if (!activeEl || !menuEl.contains(activeEl)) return;

		const role = activeEl.getAttribute("role");
		if (role === "menuitem" || role === "menuitemcheckbox" || role === "menuitemradio") {
			activeEl.click();
		}
	}

	/** Query all enabled menuitems inside the menu container. */
	#getEnabledItems(menuEl: HTMLElement): HTMLElement[] {
		return Array.from(
			menuEl.querySelectorAll(
				'[role="menuitem"]:not([data-disabled]), [role="menuitemcheckbox"]:not([data-disabled]), [role="menuitemradio"]:not([data-disabled])'
			)
		) as HTMLElement[];
	}

	/** Focus the first enabled item. Called by wrappers when menu opens. */
	focusFirst(menuEl: HTMLElement | null): void {
		if (!menuEl) return;
		this.#focusItem("first", menuEl);
	}

	/** Focus the last enabled item. Called by wrappers when menu opens via End key. */
	focusLast(menuEl: HTMLElement | null): void {
		if (!menuEl) return;
		this.#focusItem("last", menuEl);
	}
}
