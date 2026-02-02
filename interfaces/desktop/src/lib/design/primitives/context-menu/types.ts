/**
 * @file ContextMenu Primitive Types
 * @description Structural type declarations for the context-menu primitive.
 * Aligned to taxonomy contract: kind="context-menu"
 * Slots: root, trigger, content, group, item, checkbox-item, radio-group, radio-item, label, separator, sub, sub-trigger, sub-content
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA via component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** ContextMenu root — renderless context provider (no DOM element) */
export interface ContextMenuProps extends BaseProps {
	/** Open state (bindable) */
	open?: boolean;
	children?: Snippet;
}

/** ContextMenu trigger — div wrapping right-click target area */
export interface ContextMenuTriggerProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu content — floating menu panel */
export interface ContextMenuContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu group — logical grouping of menu items */
export interface ContextMenuGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu item — individual selectable menu entry */
export interface ContextMenuItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu checkbox item — toggleable menu entry with check state */
export interface ContextMenuCheckboxItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu radio group — mutually exclusive group of radio items */
export interface ContextMenuRadioGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu radio item — selectable entry within a radio group */
export interface ContextMenuRadioItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu label — non-interactive label for a group */
export interface ContextMenuLabelProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu separator — visual divider between items/groups */
export interface ContextMenuSeparatorProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu sub — renderless container for a submenu (no DOM element) */
export interface ContextMenuSubProps extends BaseProps {
	children?: Snippet;
}

/** ContextMenu sub-trigger — item that opens a submenu on hover/focus */
export interface ContextMenuSubTriggerProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** ContextMenu sub-content — floating submenu panel */
export interface ContextMenuSubContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
