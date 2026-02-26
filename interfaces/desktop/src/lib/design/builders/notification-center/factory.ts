/**
 * @file builders/notification-center/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight NotificationCenter builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * role="log", aria-live="polite", aria-relevant="additions" on root.
 * Compound: open/close state, Escape to close.
 *
 * Slots: root, header, list, item, action, empty.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	extract,
	kbd,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { NotificationCenterProps } from "./types.js";

const metadata = createBuilderMetadata("notification-center", [
	"root",
	"header",
	"list",
	"item",
	"action",
	"empty",
] as const);

export class NotificationCenter {
	readonly ids = metadata.createIds();

	#open: Synced<boolean>;
	#props: NotificationCenterProps;

	constructor(props: NotificationCenterProps = {} as NotificationCenterProps) {
		this.#props = props;

		this.#open = new Synced<boolean>({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
	}

	// --- Reactive state ---

	get open(): boolean {
		return this.#open.current;
	}

	/** Open the notification center. */
	show(): void {
		this.#open.current = true;
	}

	/** Close the notification center. */
	close(): void {
		this.#open.current = false;
	}

	/** Toggle the notification center open/closed. */
	toggle(): void {
		this.#open.current = !this.#open.current;
	}

	// --- Slot attribute getters ---

	get root(): SlotAttrs {
		const ariaLabel = extract(this.#props["aria-label"], "Notifications");
		const ariaLabelledby = extract(this.#props["aria-labelledby"], undefined);

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "log",
			"aria-live": "polite",
			"aria-relevant": "additions",
			"aria-label": ariaLabelledby ? undefined : ariaLabel,
			"aria-labelledby": ariaLabelledby,
			"data-state": this.open ? "open" : "closed",
			onkeydown: (e: KeyboardEvent) => {
				if (e.key === kbd.ESCAPE) {
					e.preventDefault();
					this.close();
				}
			},
		};
	}

	get header(): SlotAttrs {
		return {
			[metadata.dataAttrs.header]: "",
			id: this.ids.header,
		};
	}

	get list(): SlotAttrs {
		return {
			[metadata.dataAttrs.list]: "",
			id: this.ids.list,
		};
	}

	/** Get attributes for a notification item. */
	getItem(itemId: string): SlotAttrs {
		return {
			[metadata.dataAttrs.item]: "",
			id: `${this.ids.item}-${itemId}`,
			"data-item-id": itemId,
		};
	}

	get action(): SlotAttrs {
		return {
			[metadata.dataAttrs.action]: "",
			id: this.ids.action,
		};
	}

	get empty(): SlotAttrs {
		return {
			[metadata.dataAttrs.empty]: "",
			id: this.ids.empty,
			role: "status",
		};
	}
}

/** Factory function — preferred API. */
export function createNotificationCenter(props?: NotificationCenterProps): NotificationCenter {
	return new NotificationCenter(props);
}
