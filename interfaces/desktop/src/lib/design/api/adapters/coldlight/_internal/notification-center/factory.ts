/**
 * @file builders/notification-center/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight NotificationCenter builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * `role="log"`, `aria-live="polite"`, `aria-relevant="additions"` on root.
 * Compound: open/close state, Escape to close.
 *
 * Slots: root, header, list, item, action, empty.
 */

import { Synced } from "../../../../../builders/_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
	kbd,
} from "../../../../../builders/_internal/index.js";
import type { NotificationCenterProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("notification-center", [
	"root",
	"header",
	"list",
	"item",
	"action",
	"empty",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight NotificationCenter builder.
 *
 * Provides ARIA-compliant attribute objects for a notification panel with
 * `role="log"` and `aria-live="polite"` semantics. Manages open/close state
 * and supports Escape key dismissal.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createNotificationCenter } from '$lib/design/builders/notification-center';
 *   const nc = createNotificationCenter({
 *     'aria-label': 'Notifications',
 *     onOpenChange: (open) => console.log('open:', open),
 *   });
 * </script>
 *
 * <div {...nc.root}>
 *   <div {...nc.header}>Notifications</div>
 *   <ul {...nc.list}>
 *     <li {...nc.getItem('msg-1')}>New message</li>
 *   </ul>
 *   <div {...nc.action}>Mark all read</div>
 *   <div {...nc.empty}>No notifications</div>
 * </div>
 * ```
 */
export class NotificationCenter {
	/** Unique IDs for each slot of this instance. */
	readonly ids: Record<
		"root" | "header" | "list" | "item" | "action" | "empty",
		string
	> = metadata.createIds();

	#open: Synced<boolean>;
	#props: NotificationCenterProps;

	/**
	 * Create a new NotificationCenter builder instance.
	 *
	 * @param props - Configuration options for the notification center.
	 */
	constructor(props: NotificationCenterProps = {}) {
		this.#props = props;

		this.#open = new Synced<boolean>({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** Whether the notification center panel is currently open. */
	get open(): boolean {
		return this.#open.current;
	}

	// ========================================================================
	// Actions
	// ========================================================================

	/** Open the notification center panel. */
	show(): void {
		this.#open.current = true;
	}

	/** Close the notification center panel. */
	close(): void {
		this.#open.current = false;
	}

	/** Toggle the notification center open/closed. */
	toggle(): void {
		this.#open.current = !this.#open.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root container attributes.
	 *
	 * Spread onto the outermost notification center element. Provides
	 * `role="log"` with `aria-live="polite"` and `aria-relevant="additions"`
	 * for live region semantics. Handles Escape key to close.
	 */
	get root() {
		const ariaLabel = extract(this.#props["aria-label"], "Notifications");
		const ariaLabelledby = extract(
			this.#props["aria-labelledby"],
			undefined,
		);

		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "log" as const,
			"aria-live": "polite" as const,
			"aria-relevant": "additions" as const,
			"aria-label": ariaLabelledby ? undefined : ariaLabel,
			"aria-labelledby": ariaLabelledby,
			"data-state": this.open
				? ("open" as const)
				: ("closed" as const),
			onkeydown: (e: KeyboardEvent) => {
				if (e.key === kbd.ESCAPE) {
					e.preventDefault();
					this.close();
				}
			},
		};
	}

	/**
	 * Header slot attributes.
	 *
	 * Spread onto the notification center header element (e.g. title bar).
	 */
	get header() {
		return {
			[metadata.dataAttrs.header]: "" as const,
			id: this.ids.header,
		};
	}

	/**
	 * List slot attributes.
	 *
	 * Spread onto the notification list container (e.g. `<ul>`).
	 */
	get list() {
		return {
			[metadata.dataAttrs.list]: "" as const,
			id: this.ids.list,
		};
	}

	/**
	 * Get attributes for an individual notification item.
	 *
	 * Each item gets a unique compound ID and a data-item-id for targeting.
	 *
	 * @param itemId - A unique identifier for this notification item.
	 * @returns Exact-typed attribute object for the notification item.
	 */
	getItem(itemId: string) {
		return {
			[metadata.dataAttrs.item]: "" as const,
			id: `${this.ids.item}-${itemId}`,
			"data-item-id": itemId,
		};
	}

	/**
	 * Action slot attributes.
	 *
	 * Spread onto a bulk action element (e.g. "Mark all as read" button).
	 */
	get action() {
		return {
			[metadata.dataAttrs.action]: "" as const,
			id: this.ids.action,
		};
	}

	/**
	 * Empty state slot attributes.
	 *
	 * Spread onto the element shown when there are no notifications.
	 * Uses `role="status"` for polite announcement.
	 */
	get empty() {
		return {
			[metadata.dataAttrs.empty]: "" as const,
			id: this.ids.empty,
			role: "status" as const,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for the NotificationCenter builder — preferred API.
 *
 * @param props - Optional configuration for the notification center.
 * @returns A new NotificationCenter builder instance.
 */
export function createNotificationCenter(
	props?: NotificationCenterProps,
): NotificationCenter {
	return new NotificationCenter(props);
}
