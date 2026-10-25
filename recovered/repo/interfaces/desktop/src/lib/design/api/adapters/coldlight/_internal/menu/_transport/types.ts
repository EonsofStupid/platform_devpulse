/**
 * @file api/adapters/coldlight/_internal/menu/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the ColdLight menu builder.
 * Maps ColdLightMenu → ColdLight slot vocabulary.
 *
 * The menu is a base pattern consumed by DropdownMenu and ContextMenu.
 * It provides content (role="menu"), parameterized items (role="menuitem"),
 * groups, and separators.
 *
 * Slots (static): content, separator
 * Slots (parameterized): getItem(meta), getGroup(label)
 * States: orientation
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { SlotAttrs, TransportAdapter } from "../../_transport/types.js";

// ─────────────────────────────────────────────────────────
// ITEM META — passed to getItem() for per-item slot attrs
// ─────────────────────────────────────────────────────────

export interface MenuItemMeta {
	/** Unique value identifying this item. */
	value: string;
	/** Whether this item is disabled. */
	disabled?: boolean;
	/** For menuitemcheckbox: whether checked. */
	checked?: boolean;
	/** For menuitemradio: radio group name. */
	radioGroup?: string;
	/** For menuitemradio: whether this radio is checked. */
	radioChecked?: boolean;
}

// ─────────────────────────────────────────────────────────
// TRANSPORT STATES
// ─────────────────────────────────────────────────────────

export interface MenuTransportStates {
	/** Menu orientation. */
	readonly orientation: "horizontal" | "vertical";
}

// ─────────────────────────────────────────────────────────
// TRANSPORT CONFIG
// ─────────────────────────────────────────────────────────

export interface MenuTransportConfig {
	/** Menu orientation. @default "vertical" */
	orientation?: "horizontal" | "vertical";
	/** Whether arrow keys loop. @default true */
	loop?: boolean;
	/** Typeahead timeout in ms. @default 500 */
	typeaheadTimeout?: number;
	/** Called when Escape is pressed. */
	onClose?: () => void;
}

// ─────────────────────────────────────────────────────────
// TRANSPORT ACTIONS (parameterized slots)
// ─────────────────────────────────────────────────────────

export interface MenuActions {
	/** Get slot attrs for a menu item. */
	getItem(meta: MenuItemMeta): SlotAttrs;
	/** Get slot attrs for a labeled group. */
	getGroup(label: string): SlotAttrs;
	/** Focus the first enabled item. Call after menu opens. */
	focusFirst(menuEl: HTMLElement | null): void;
	/** Focus the last enabled item. */
	focusLast(menuEl: HTMLElement | null): void;
}

// ─────────────────────────────────────────────────────────
// TRANSPORT ADAPTER
// ─────────────────────────────────────────────────────────

/**
 * ColdLight menu transport — base menu pattern.
 *
 * Static slots: content (role="menu"), separator (role="separator")
 * Parameterized: getItem(meta), getGroup(label)
 * Focus helpers: focusFirst(), focusLast()
 */
export type MenuTransport = TransportAdapter<"content" | "separator", MenuTransportStates> & MenuActions;
