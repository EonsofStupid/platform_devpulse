/**
 * @file Toolbar Primitive Types
 * @description Structural type declarations for the toolbar primitive.
 * Aligned to taxonomy contract: kind="toolbar"
 * Slots: root, group, item, separator, link
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Toolbar root — container for toolbar items and groups */
export interface ToolbarProps extends OmitStyle<HTMLDivElement>, BaseProps {
	orientation?: "horizontal" | "vertical";
	children?: Snippet;
}

/** Toolbar group — logical grouping of related toolbar items */
export interface ToolbarGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Toolbar item — individual actionable button within the toolbar */
export interface ToolbarItemProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** Toolbar separator — visual divider between toolbar items or groups */
export interface ToolbarSeparatorProps extends OmitStyle<HTMLDivElement>, BaseProps {
	orientation?: "horizontal" | "vertical";
	children?: Snippet;
}

/** Toolbar link — navigational anchor within the toolbar */
export interface ToolbarLinkProps extends OmitStyle<HTMLAnchorElement>, BaseProps {
	children?: Snippet;
}
