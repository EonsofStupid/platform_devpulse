/**
 * @file Menubar Primitive Types
 * @description Structural type declarations for the menubar primitive.
 * Aligned to taxonomy contract: kind="menubar"
 * Slots: root, menu, trigger, content, group, item, checkbox-item, radio-group, radio-item, label, separator, sub, sub-trigger, sub-content
 * ariaStateProvider: "meltui" — createMenubar provides roving tabindex + menu management.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Menubar root — DOM container with menubar context */
export interface MenubarProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar menu — renderless context provider for a single menu */
export interface MenubarMenuProps extends BaseProps {
	/** Open state (bindable) */
	open?: boolean;
	children?: Snippet;
}

/** Menubar trigger — button that opens a menu */
export interface MenubarTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** Menubar content — dropdown panel containing menu items */
export interface MenubarContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar group — logical grouping of menu items */
export interface MenubarGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar item — selectable menu entry */
export interface MenubarItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar checkbox item — toggleable menu entry with checked state */
export interface MenubarCheckboxItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar radio group — exclusive selection group within a menu */
export interface MenubarRadioGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar radio item — selectable entry within a radio group */
export interface MenubarRadioItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar label — non-interactive label for a group */
export interface MenubarLabelProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar separator — visual divider between menu sections */
export interface MenubarSeparatorProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar sub — renderless provider for a submenu */
export interface MenubarSubProps extends BaseProps {
	children?: Snippet;
}

/** Menubar sub-trigger — element that opens a submenu */
export interface MenubarSubTriggerProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Menubar sub-content — dropdown panel for a submenu */
export interface MenubarSubContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
