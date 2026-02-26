/**
 * @file builders/sheet/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Sheet builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Slide-in panel overlay pattern:
 * - Trigger: button that opens the sheet
 * - Overlay: backdrop, closes on click
 * - Content: role="dialog", aria-modal="true", aria-label
 * - Close: button that closes the sheet
 *
 * Keyboard: Escape closes. Tab trapped within content when open.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	extract,
	kbd,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { SheetProps, SheetSide } from "./types.js";

const metadata = createBuilderMetadata(
	"sheet",
	["trigger", "overlay", "content", "close"] as const,
);

export class Sheet {
	readonly ids = metadata.createIds();
	#open: Synced<boolean>;
	#label: Synced<string | undefined>;
	#side: Synced<SheetSide>;
	#closeOnEscape: Synced<boolean>;
	#closeOnOutsideClick: Synced<boolean>;

	constructor(props: SheetProps = {} as SheetProps) {
		this.#open = new Synced<boolean>({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});

		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});

		this.#side = new Synced<SheetSide>({
			value: props.side,
			defaultValue: "right",
		});

		this.#closeOnEscape = new Synced<boolean>({
			value: props.closeOnEscape,
			defaultValue: true,
		});

		this.#closeOnOutsideClick = new Synced<boolean>({
			value: props.closeOnOutsideClick,
			defaultValue: true,
		});
	}

	// --- Reactive state ---

	get open(): boolean {
		return this.#open.current;
	}

	set open(value: boolean) {
		this.#open.current = value;
	}

	get side(): SheetSide {
		return this.#side.current;
	}

	// --- Slot attribute getters ---

	/** Trigger button attributes. Spread onto the element that opens the sheet. */
	get trigger(): SlotAttrs {
		return {
			[metadata.dataAttrs.trigger]: "",
			id: this.ids.trigger,
			"aria-haspopup": "dialog",
			"aria-expanded": this.open,
			"aria-controls": this.ids.content,
			"data-state": this.open ? "open" : "closed",

			onclick: () => {
				this.#open.current = true;
			},
		};
	}

	/** Overlay backdrop attributes. Spread onto the backdrop element. */
	get overlay(): SlotAttrs {
		return {
			[metadata.dataAttrs.overlay]: "",
			id: this.ids.overlay,
			role: "presentation",
			"aria-hidden": "true",
			"data-state": this.open ? "open" : "closed",

			onclick: () => {
				if (this.#closeOnOutsideClick.current) {
					this.#open.current = false;
				}
			},
		};
	}

	/** Content panel attributes. Spread onto the dialog content element. */
	get content(): SlotAttrs {
		return {
			[metadata.dataAttrs.content]: "",
			id: this.ids.content,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": this.#label.current,
			"data-state": this.open ? "open" : "closed",
			"data-side": this.side,

			onkeydown: (e: KeyboardEvent) => {
				if (e.key === kbd.ESCAPE && this.#closeOnEscape.current) {
					e.preventDefault();
					this.#open.current = false;
				}
			},
		};
	}

	/** Close button attributes. Spread onto the close button element. */
	get close(): SlotAttrs {
		return {
			[metadata.dataAttrs.close]: "",
			id: this.ids.close,
			"aria-label": "Close",
			"data-state": this.open ? "open" : "closed",

			onclick: () => {
				this.#open.current = false;
			},
		};
	}
}

/** Factory function — preferred API. */
export function createSheet(props?: SheetProps): Sheet {
	return new Sheet(props);
}
