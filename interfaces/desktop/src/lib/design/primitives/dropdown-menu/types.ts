/**
 * @file DropdownMenu Primitive Types
 * @description Structural type declarations for the dropdown-menu primitive.
 * Aligned to taxonomy contract: kind="dropdown-menu"
 * Slots: root, trigger, content, group, item, checkbox-item, radio-group, radio-item, label, separator, sub, sub-trigger, sub-content
 * ariaStateProvider: "meltui" — createDropdownMenu provides ARIA roles, keyboard nav, and dismiss behavior.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** DropdownMenu root — renderless context provider (no DOM element) */
export interface DropdownMenuProps extends BaseProps {
	/** Open state (bindable) */
	open?: boolean;
	children?: Snippet;
}

/** DropdownMenu trigger — button that opens the dropdown menu */
export interface DropdownMenuTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu content — overlay container for menu items */
export interface DropdownMenuContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu group — logical grouping of related menu items */
export interface DropdownMenuGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu item — individual actionable menu entry */
export interface DropdownMenuItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu checkbox-item — togglable menu entry with checked state */
export interface DropdownMenuCheckboxItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu radio-group — container for mutually exclusive radio items */
export interface DropdownMenuRadioGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu radio-item — mutually exclusive selectable menu entry */
export interface DropdownMenuRadioItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu label — non-interactive label for a group of items */
export interface DropdownMenuLabelProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu separator — visual divider between groups of items */
export interface DropdownMenuSeparatorProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu sub — renderless context provider for a submenu (no DOM element) */
export interface DropdownMenuSubProps extends BaseProps {
	children?: Snippet;
}

/** DropdownMenu sub-trigger — item that opens a nested submenu */
export interface DropdownMenuSubTriggerProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DropdownMenu sub-content — overlay container for submenu items */
export interface DropdownMenuSubContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
