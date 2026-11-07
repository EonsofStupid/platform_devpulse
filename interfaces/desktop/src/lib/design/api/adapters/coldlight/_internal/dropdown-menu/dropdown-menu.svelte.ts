/**
 * @file api/adapters/coldlight/_internal/dropdown-menu/dropdown-menu.svelte.ts
 * @package @devpulse/coldlight
 *
 * ColdLight DropdownMenu — Svelte 5 runes-native dropdown menu.
 *
 * Composes ColdLightMenu (ARIA menu pattern) with trigger-activated
 * popup semantics. The trigger is a button that opens/closes the menu.
 *
 * Owns:
 * - Trigger slot: aria-haspopup="menu", aria-expanded, aria-controls
 * - Open/close state management
 * - Dismiss layer (outside click closes)
 * - Escape layer (Escape closes + focus restore)
 * - Presence (transition-aware mount/unmount)
 * - Focus management (first item on open, trigger on close)
 *
 * Delegates to ColdLightMenu:
 * - Content slot (role="menu")
 * - Item slots (role="menuitem", "menuitemcheckbox", "menuitemradio")
 * - Keyboard navigation (Arrow keys, Home, End, typeahead)
 * - Separator, group slots
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/
 */

import { tick } from "svelte";
import { generateId } from "../_transport/ids.js";
import { useDismissLayer } from "../_transport/dismiss-layer.svelte.js";
import { useEscapeLayer } from "../_transport/escape-layer.svelte.js";
import { usePresence } from "../_transport/presence.svelte.js";
import { extract, type MaybeGetter, type SlotAttrs } from "../_transport/types.js";
import { ColdLightMenu } from "../menu/menu.svelte.js";
import type { MenuItemMeta } from "../menu/_transport/types.js";

export interface ColdLightDropdownMenuConfig {
    /** Whether the menu is open. */
    open?: MaybeGetter<boolean>;
    /** Called when open state changes. */
    onOpenChange?: (value: boolean) => void;
    /** Menu orientation. @default "vertical" */
    orientation?: MaybeGetter<"horizontal" | "vertical">;
    /** Whether arrow keys loop. @default true */
    loop?: MaybeGetter<boolean>;
    /** Typeahead timeout in ms. @default 500 */
    typeaheadTimeout?: MaybeGetter<number>;
    /** Whether outside click closes. @default true */
    closeOnOutsideClick?: MaybeGetter<boolean>;
    /** Whether Escape closes. @default true */
    closeOnEscape?: MaybeGetter<boolean>;
}

export class ColdLightDropdownMenu {
    #config: ColdLightDropdownMenuConfig = {};
    #id: string;
    #menu: ColdLightMenu;

    // --- State ---
    #open = $state(false);
    #triggerEl: HTMLElement | null = null;
    #contentEl: HTMLElement | null = null;

    // --- Derived config ---
    #closeOnOutsideClick = $derived(extract(this.#config.closeOnOutsideClick, true));
    #closeOnEscape = $derived(extract(this.#config.closeOnEscape, true));

    constructor(config: ColdLightDropdownMenuConfig = {}) {
        this.#config = config;
        this.#open = extract(config.open, false);
        this.#id = generateId("ddmenu");

        // Create the inner menu, wiring onClose to our close
        this.#menu = new ColdLightMenu({
            orientation: config.orientation,
            loop: config.loop,
            typeaheadTimeout: config.typeaheadTimeout,
            onClose: () => this.#close(),
        });
    }

    // --- Open state ---
    get open(): boolean {
        return this.#open;
    }

    set open(v: boolean) {
        if (v === this.#open) return;
        this.#open = v;
        this.#config.onOpenChange?.(v);

        if (v) {
            // Focus first item after DOM update
            tick().then(() => {
                this.#menu.focusFirst(this.#contentEl);
            });
        }
    }

    #close(): void {
        this.open = false;
        // WCAG: restore focus to trigger
        this.#triggerEl?.focus();
    }

    // --- Slot attrs ---

    /** Trigger button that opens/closes the dropdown menu. */
    get trigger(): SlotAttrs {
        return {
            type: "button",
            id: `${this.#id}-trigger`,
            "aria-haspopup": "menu",
            "aria-expanded": this.#open,
            "aria-controls": this.#menu.id,
            "data-open": this.#open ? "" : undefined,
            onclick: () => {
                this.open = !this.open;
            },
            onkeydown: (e: KeyboardEvent) => this.#handleTriggerKeydown(e),
        };
    }

    /** Menu content container — delegates to ColdLightMenu. */
    get content(): SlotAttrs {
        return {
            ...this.#menu.content,
            "data-open": this.#open ? "" : undefined,
        };
    }

    /** Separator between menu item groups. */
    get separator(): SlotAttrs {
        return this.#menu.separator;
    }

    /** Get slot attrs for a menu item. Delegates to ColdLightMenu. */
    getItem(meta: MenuItemMeta): SlotAttrs {
        return this.#menu.getItem(meta);
    }

    /** Get slot attrs for a labeled group. Delegates to ColdLightMenu. */
    getGroup(label: string): SlotAttrs {
        return this.#menu.getGroup(label);
    }

    get orientation(): "horizontal" | "vertical" {
        return this.#menu.orientation;
    }

    // --- Trigger keyboard ---

    #handleTriggerKeydown(e: KeyboardEvent): void {
        switch (e.key) {
            case "Enter":
            case " ":
            case "ArrowDown":
                e.preventDefault();
                this.open = true;
                tick().then(() => {
                    this.#menu.focusFirst(this.#contentEl);
                });
                break;
            case "ArrowUp":
                e.preventDefault();
                this.open = true;
                tick().then(() => {
                    this.#menu.focusLast(this.#contentEl);
                });
                break;
        }
    }

    // --- Attachment functions (Svelte action protocol) ---

    /** Attach to the menu content element. Sets up dismiss + escape + presence. */
    attachContent = (node: HTMLElement): { destroy(): void } => {
        this.#contentEl = node;

        useDismissLayer({
            enabled: () => this.#open && this.#closeOnOutsideClick,
            node: () => this.#contentEl,
            onDismiss: () => this.#close(),
        });

        useEscapeLayer({
            enabled: () => this.#open && this.#closeOnEscape,
            onEscape: () => this.#close(),
        });

        usePresence({
            open: () => this.#open,
            node: () => this.#contentEl,
            onExitComplete: () => {
                // Element hidden after transition
            },
        });

        return {
            destroy: () => {
                this.#contentEl = null;
            },
        };
    };

    /** Attach to the trigger element (for focus restore). */
    attachTrigger = (node: HTMLElement): { destroy(): void } => {
        this.#triggerEl = node;

        return {
            destroy: () => {
                this.#triggerEl = null;
            },
        };
    };
}
