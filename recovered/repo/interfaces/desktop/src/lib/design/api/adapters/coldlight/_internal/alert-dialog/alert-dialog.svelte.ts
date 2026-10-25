/**
 * @file api/adapters/coldlight/_internal/alert-dialog/alert-dialog.svelte.ts
 * @package @devpulse/coldlight
 *
 * ColdLight AlertDialog — Svelte 5 runes-native alert dialog.
 *
 * Extends the dialog pattern with forced-action semantics:
 * - `role="alertdialog"` announces urgency to assistive tech
 * - Does NOT close on outside click (user must take explicit action)
 * - Does NOT close on Escape by default (configurable)
 * - Scroll lock and focus trap are mandatory
 * - Focus restores to trigger on close
 *
 * Slots: trigger, content, overlay, portal, title, description, cancel, action
 * Unlike regular Dialog which has a generic "close" slot, AlertDialog
 * has semantic "cancel" and "action" slots for explicit user actions.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 */

import { tick } from "svelte";
import { generateId } from "../_transport/ids.js";
import { usePresence } from "../_transport/presence.svelte.js";
import { useScrollLock } from "../_transport/scroll-lock.svelte.js";
import { extract, type MaybeGetter, type SlotAttrs } from "../_transport/types.js";

export interface ColdLightAlertDialogConfig {
    /** Whether the alert dialog is open. */
    open?: MaybeGetter<boolean>;
    /** Called when open state changes. */
    onOpenChange?: (value: boolean) => void;
    /** Whether Escape key closes the dialog. @default false (forced action) */
    closeOnEscape?: MaybeGetter<boolean>;
    /** Whether to lock body scroll when open. @default true */
    preventScroll?: MaybeGetter<boolean>;
}

/** ID set for alertdialog ARIA linking. */
interface AlertDialogIds {
    content: string;
    title: string;
    description: string;
}

function createAlertDialogIds(): AlertDialogIds {
    const base = generateId("adlg");
    return {
        content: `${base}-content`,
        title: `${base}-title`,
        description: `${base}-desc`,
    };
}

export class ColdLightAlertDialog {
    #config: ColdLightAlertDialogConfig = {};

    // --- State ---
    #open = $state(false);
    #ids = createAlertDialogIds();
    #contentEl: HTMLDialogElement | null = null;
    #overlayEl: HTMLElement | null = null;
    #triggerEl: HTMLElement | null = null;

    // --- Derived config ---
    #closeOnEscape = $derived(extract(this.#config.closeOnEscape, false));
    #preventScroll = $derived(extract(this.#config.preventScroll, true));

    constructor(config: ColdLightAlertDialogConfig = {}) {
        this.#config = config;
        this.#open = extract(config.open, false);
    }

    // --- Open state ---
    get open(): boolean {
        return this.#open;
    }

    set open(v: boolean) {
        if (v === this.#open) return;

        if (v) {
            this.#open = v;
            this.#config.onOpenChange?.(v);
            tick().then(() => {
                this.#contentEl?.showModal?.();
                this.#overlayEl?.showPopover?.();
            });
        } else {
            this.#open = v;
            this.#config.onOpenChange?.(v);
            // presence handles transitionend → close()
        }
    }

    // --- Slot attrs ---

    /** Trigger button that opens the alert dialog. */
    get trigger(): SlotAttrs {
        return {
            type: "button",
            "aria-haspopup": "dialog",
            "aria-expanded": this.#open,
            "aria-controls": this.#ids.content,
            "data-open": this.#open ? "" : undefined,
            onclick: () => {
                this.open = !this.open;
            },
        };
    }

    /** Alert dialog content container. Uses role="alertdialog". */
    get content(): SlotAttrs {
        return {
            id: this.#ids.content,
            role: "alertdialog",
            "aria-modal": "true",
            "aria-labelledby": this.#ids.title,
            "aria-describedby": this.#ids.description,
            "data-open": this.#open ? "" : undefined,
            onclose: () => {
                this.open = false;
            },
            oncancel: (e: Event) => {
                e.preventDefault();
                if (this.#closeOnEscape) this.open = false;
            },
        };
    }

    /** Overlay behind the alert dialog (blocks interaction). */
    get overlay(): SlotAttrs {
        return {
            "aria-hidden": "true",
            popover: "manual",
            "data-open": this.#open ? "" : undefined,
        };
    }

    /** Portal wrapper (no ARIA attrs needed). */
    get portal(): SlotAttrs {
        return {};
    }

    /** Title element — linked via aria-labelledby. */
    get title(): SlotAttrs {
        return { id: this.#ids.title };
    }

    /** Description element — linked via aria-describedby. */
    get description(): SlotAttrs {
        return { id: this.#ids.description };
    }

    /** Cancel button — closes without taking action. */
    get cancel(): SlotAttrs {
        return {
            type: "button",
            onclick: () => {
                this.open = false;
            },
        };
    }

    /** Action button — performs the destructive/confirming action. */
    get action(): SlotAttrs {
        return {
            type: "button",
        };
    }

    // --- Attachment functions (Svelte action protocol) ---

    /** Attach to the <dialog> content element. Sets up scroll lock + presence. */
    attachContent = (node: HTMLDialogElement): { destroy(): void } => {
        this.#contentEl = node;

        if (this.#open) {
            tick().then(() => {
                this.#contentEl?.showModal?.();
                this.#overlayEl?.showPopover?.();
            });
        }

        useScrollLock(() => this.#open && this.#preventScroll);

        // No useDismissLayer — alert dialogs NEVER close on outside click

        usePresence({
            open: () => this.#open,
            node: () => this.#contentEl,
            onExitComplete: () => {
                this.#contentEl?.close?.();
                this.#overlayEl?.hidePopover?.();
                // WCAG: restore focus to trigger element
                this.#triggerEl?.focus();
            },
        });

        return {
            destroy: () => {
                this.#contentEl = null;
            },
        };
    };

    /** Attach to the overlay element. */
    attachOverlay = (node: HTMLElement): { destroy(): void } => {
        this.#overlayEl = node;

        return {
            destroy: () => {
                this.#overlayEl = null;
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
