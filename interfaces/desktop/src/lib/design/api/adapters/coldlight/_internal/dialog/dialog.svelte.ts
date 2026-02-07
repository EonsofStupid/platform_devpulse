import { tick } from "svelte";
import { useDismissLayer } from "../_transport/dismiss-layer.svelte.js";
import { createDialogIds } from "../_transport/ids.js";
import { usePresence } from "../_transport/presence.svelte.js";
import { useScrollLock } from "../_transport/scroll-lock.svelte.js";
import { extract, type MaybeGetter, type SlotAttrs } from "../_transport/types.js";

export interface ColdLightDialogConfig {
	open?: MaybeGetter<boolean>;
	onOpenChange?: (value: boolean) => void;
	closeOnEscape?: MaybeGetter<boolean>;
	closeOnOutsideClick?: MaybeGetter<boolean>;
	preventScroll?: MaybeGetter<boolean>;
}

export class ColdLightDialog {
	#config: ColdLightDialogConfig = {};

	// --- State ---
	#open = $state(false);
	#ids = createDialogIds();
	#contentEl: HTMLDialogElement | null = null;
	#overlayEl: HTMLElement | null = null;
	#triggerEl: HTMLElement | null = null;

	// --- Derived config ---
	#closeOnEscape = $derived(extract(this.#config.closeOnEscape, true));
	#closeOnOutsideClick = $derived(extract(this.#config.closeOnOutsideClick, true));
	#preventScroll = $derived(extract(this.#config.preventScroll, true));

	constructor(config: ColdLightDialogConfig = {}) {
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

	get content(): SlotAttrs {
		return {
			id: this.#ids.content,
			role: "dialog",
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

	get overlay(): SlotAttrs {
		return {
			"aria-hidden": "true",
			popover: "manual",
			"data-open": this.#open ? "" : undefined,
		};
	}

	get portal(): SlotAttrs {
		return {};
	}

	get title(): SlotAttrs {
		return { id: this.#ids.title };
	}

	get description(): SlotAttrs {
		return { id: this.#ids.description };
	}

	get close(): SlotAttrs {
		return {
			type: "button",
			onclick: () => {
				this.open = false;
			},
		};
	}

	// --- Attachment functions (Svelte action protocol) ---
	attachContent = (node: HTMLDialogElement): { destroy(): void } => {
		this.#contentEl = node;

		// If already open at attach time (e.g. open prop passed on mount),
		// call showModal/showPopover immediately so native dialog behavior activates.
		if (this.#open) {
			tick().then(() => {
				this.#contentEl?.showModal?.();
				this.#overlayEl?.showPopover?.();
			});
		}

		useScrollLock(() => this.#open && this.#preventScroll);

		useDismissLayer({
			enabled: () => this.#open && this.#closeOnOutsideClick,
			node: () => this.#contentEl,
			onDismiss: () => {
				this.open = false;
			},
		});

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

	attachOverlay = (node: HTMLElement): { destroy(): void } => {
		this.#overlayEl = node;

		return {
			destroy: () => {
				this.#overlayEl = null;
			},
		};
	};

	attachTrigger = (node: HTMLElement): { destroy(): void } => {
		this.#triggerEl = node;

		return {
			destroy: () => {
				this.#triggerEl = null;
			},
		};
	};
}
