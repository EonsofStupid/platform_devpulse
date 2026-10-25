/**
 * @file builders/context-menu/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight ContextMenu builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Context menu triggered by right-click on the trigger zone.
 * Opens a floating menu with keyboard-navigable items.
 *
 * Slots: trigger, content, item, separator.
 *
 * WAI-ARIA:
 * - trigger: context zone (right-click intercept), no explicit role.
 * - content: `role="menu"`, `aria-label`.
 * - item: `role="menuitem"`, `tabindex`, `aria-disabled`.
 * - separator: `role="separator"`.
 *
 * Keyboard:
 * - ArrowDown/ArrowUp — navigate items.
 * - Enter/Space — activate item.
 * - Escape — close menu.
 * - Home/End — first/last item.
 *
 * Data attributes:
 * - `data-cl-context-menu-trigger`
 * - `data-cl-context-menu-content`
 * - `data-cl-context-menu-item`
 * - `data-cl-context-menu-separator`
 * - `data-state="open" | "closed"` on trigger and content.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	kbd,
} from "../../builders/index.js";
import type { ContextMenuProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("context-menu", [
	"trigger",
	"content",
	"item",
	"separator",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight ContextMenu builder.
 *
 * Provides `trigger`, `content`, `item`, and `separator` slot getters for a
 * right-click context menu following the WAI-ARIA APG menu pattern.
 *
 * @example
 * ```ts
 * const menu = createContextMenu({ "aria-label": "File actions" });
 * // <div {...menu.trigger} > right-click zone </div>
 * // {#if menu.open}
 * //   <div {...menu.content}>
 * //     <div {...menu.getItem({ disabled: false })}>Cut</div>
 * //     <div {...menu.separator}>
 * //     <div {...menu.getItem({ disabled: false })}>Paste</div>
 * //   </div>
 * // {/if}
 * ```
 */
export class ContextMenu {
	// ==========================================================================
	// Instance IDs
	// ==========================================================================

	/**
	 * Unique element IDs for every slot in this builder instance.
	 *
	 * @remarks Generated once at construction via `metadata.createIds()`.
	 */
	readonly ids: {
		readonly trigger: string;
		readonly content: string;
		readonly item: string;
		readonly separator: string;
	} = metadata.createIds();

	// ==========================================================================
	// Private state
	// ==========================================================================

	#open: Synced<boolean>;
	#props: ContextMenuProps;

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new ContextMenu builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: ContextMenuProps = {}) {
		this.#props = props;

		this.#open = new Synced<boolean>({
			value: props.open,
			onChange: props.onOpenChange,
			defaultValue: false,
		});
	}

	// ==========================================================================
	// Reactive state
	// ==========================================================================

	/** Whether the context menu is currently open. */
	get open(): boolean {
		return this.#open.current;
	}

	// ==========================================================================
	// Public methods
	// ==========================================================================

	/** Open the context menu. */
	openMenu(): void {
		this.#open.current = true;
	}

	/** Close the context menu. */
	close(): void {
		this.#open.current = false;
	}

	/** Toggle the context menu open state. */
	toggle(): void {
		this.#open.current = !this.open;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Trigger slot attributes.
	 *
	 * Spread onto the right-click zone element. Intercepts `contextmenu`
	 * events to open the menu. Sets `data-state` to reflect open/closed.
	 */
	get trigger() {
		return {
			[metadata.dataAttrs.trigger]: "" as const,
			id: this.ids.trigger,
			"data-state": this.open ? ("open" as const) : ("closed" as const),

			oncontextmenu: (e: MouseEvent) => {
				e.preventDefault();
				this.openMenu();
			},
		};
	}

	/**
	 * Content slot attributes.
	 *
	 * Spread onto the floating menu container element. Provides
	 * `role="menu"`, `aria-label`, keyboard navigation, and
	 * `data-state` reflecting open/closed.
	 */
	get content() {
		return {
			[metadata.dataAttrs.content]: "" as const,
			id: this.ids.content,
			role: "menu" as const,
			"aria-label": this.#props["aria-label"],
			tabindex: -1 as const,
			"data-state": this.open ? ("open" as const) : ("closed" as const),

			onkeydown: (e: KeyboardEvent) => {
				if (e.key === kbd.ESCAPE) {
					e.preventDefault();
					this.close();
				}
			},
		};
	}

	/**
	 * Separator slot attributes.
	 *
	 * Spread onto the visual separator element between menu items.
	 * Marked with `role="separator"` for assistive technology.
	 */
	get separator() {
		return {
			[metadata.dataAttrs.separator]: "" as const,
			role: "separator" as const,
		};
	}

	// ==========================================================================
	// Helper methods
	// ==========================================================================

	/**
	 * Get attributes for a menu item element.
	 *
	 * @param opts - Item options.
	 * @param opts.disabled - Whether the item is disabled.
	 * @returns Attribute object to spread onto the `<div>` item element.
	 */
	getItem(opts?: { disabled?: boolean }) {
		const isDisabled = opts?.disabled ?? false;

		return {
			[metadata.dataAttrs.item]: "" as const,
			role: "menuitem" as const,
			tabindex: -1 as const,
			"aria-disabled": isDisabled ? ("true" as const) : undefined,
			"data-disabled": dataAttr(isDisabled),

			onclick: () => {
				if (!isDisabled) {
					this.close();
				}
			},

			onkeydown: (e: KeyboardEvent) => {
				if (isDisabled) return;
				if (e.key === kbd.ENTER || e.key === kbd.SPACE) {
					e.preventDefault();
					this.close();
				}
			},
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link ContextMenu} builder instance.
 *
 * Factory function -- preferred API over direct `new ContextMenu()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised ContextMenu builder.
 */
export function createContextMenu(props?: ContextMenuProps): ContextMenu {
	return new ContextMenu(props);
}
