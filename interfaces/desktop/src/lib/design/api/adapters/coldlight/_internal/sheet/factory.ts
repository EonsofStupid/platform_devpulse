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
 * - Content: `role="dialog"`, `aria-modal="true"`, aria-label
 * - Close: button that closes the sheet
 *
 * Keyboard: Escape closes. Tab trapped within content when open.
 *
 * Slots: trigger, overlay, content, close.
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
	kbd,
} from "../../builders/index.js";
import type { SheetProps, SheetSide } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata(
	"sheet",
	["trigger", "overlay", "content", "close"] as const,
);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Sheet builder.
 *
 * Provides ARIA-compliant attribute objects for a slide-in panel overlay.
 * The content panel uses `role="dialog"` with `aria-modal="true"` for
 * proper modal semantics. Supports configurable side, Escape dismissal,
 * and outside-click dismissal.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createSheet } from '$lib/design/builders/sheet';
 *   const sheet = createSheet({
 *     label: 'Settings panel',
 *     side: 'right',
 *   });
 * </script>
 *
 * <button {...sheet.trigger}>Open Settings</button>
 *
 * {#if sheet.open}
 *   <div {...sheet.overlay}></div>
 *   <div {...sheet.content}>
 *     <button {...sheet.close}>Close</button>
 *     <!-- panel content -->
 *   </div>
 * {/if}
 * ```
 */
export class Sheet {
	/** Unique IDs for each slot of this instance. */
	readonly ids: Record<"trigger" | "overlay" | "content" | "close", string> =
		metadata.createIds();

	#open: Synced<boolean>;
	#label: Synced<string | undefined>;
	#side: Synced<SheetSide>;
	#closeOnEscape: Synced<boolean>;
	#closeOnOutsideClick: Synced<boolean>;

	/**
	 * Create a new Sheet builder instance.
	 *
	 * @param props - Configuration options for the sheet.
	 */
	constructor(props: SheetProps = {}) {
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

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** Whether the sheet is currently open. */
	get open(): boolean {
		return this.#open.current;
	}

	/** Set the open state directly. */
	set open(value: boolean) {
		this.#open.current = value;
	}

	/** The side the sheet slides in from — "left", "right", "top", or "bottom". */
	get side(): SheetSide {
		return this.#side.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Trigger button attributes.
	 *
	 * Spread onto the element that opens the sheet. Provides
	 * `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`,
	 * data-state, and an onclick handler that opens the sheet.
	 */
	get trigger() {
		return {
			[metadata.dataAttrs.trigger]: "" as const,
			id: this.ids.trigger,
			"aria-haspopup": "dialog" as const,
			"aria-expanded": this.open,
			"aria-controls": this.ids.content,
			"data-state": this.open
				? ("open" as const)
				: ("closed" as const),

			onclick: () => {
				this.#open.current = true;
			},
		};
	}

	/**
	 * Overlay backdrop attributes.
	 *
	 * Spread onto the backdrop element behind the sheet content.
	 * Uses `role="presentation"` and `aria-hidden="true"` since the
	 * overlay is decorative. Clicks close the sheet when
	 * `closeOnOutsideClick` is enabled.
	 */
	get overlay() {
		return {
			[metadata.dataAttrs.overlay]: "" as const,
			id: this.ids.overlay,
			role: "presentation" as const,
			"aria-hidden": "true" as const,
			"data-state": this.open
				? ("open" as const)
				: ("closed" as const),

			onclick: () => {
				if (this.#closeOnOutsideClick.current) {
					this.#open.current = false;
				}
			},
		};
	}

	/**
	 * Content panel attributes.
	 *
	 * Spread onto the dialog content element. Provides `role="dialog"`,
	 * `aria-modal="true"`, accessible label, data-state, data-side,
	 * and an Escape key handler for dismissal.
	 */
	get content() {
		return {
			[metadata.dataAttrs.content]: "" as const,
			id: this.ids.content,
			role: "dialog" as const,
			"aria-modal": "true" as const,
			"aria-label": this.#label.current,
			"data-state": this.open
				? ("open" as const)
				: ("closed" as const),
			"data-side": this.side,

			onkeydown: (e: KeyboardEvent) => {
				if (e.key === kbd.ESCAPE && this.#closeOnEscape.current) {
					e.preventDefault();
					this.#open.current = false;
				}
			},
		};
	}

	/**
	 * Close button attributes.
	 *
	 * Spread onto the close button element within the sheet content.
	 * Provides `aria-label="Close"`, data-state, and an onclick handler.
	 */
	get close() {
		return {
			[metadata.dataAttrs.close]: "" as const,
			id: this.ids.close,
			"aria-label": "Close" as const,
			"data-state": this.open
				? ("open" as const)
				: ("closed" as const),

			onclick: () => {
				this.#open.current = false;
			},
		};
	}

	// ========================================================================
	// Helper methods
	// ========================================================================

	/**
	 * Open the sheet programmatically.
	 *
	 * Named `show()` to avoid conflict with the `open` getter/setter.
	 */
	show(): void {
		this.#open.current = true;
	}

	/**
	 * Close the sheet programmatically.
	 *
	 * Named `dismiss()` to avoid conflict with the `close` slot getter.
	 */
	dismiss(): void {
		this.#open.current = false;
	}

	/** Toggle the sheet open/closed. */
	toggle(): void {
		this.#open.current = !this.open;
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for the Sheet builder — preferred API.
 *
 * @param props - Optional configuration for the sheet.
 * @returns A new Sheet builder instance.
 */
export function createSheet(props?: SheetProps): Sheet {
	return new Sheet(props);
}
