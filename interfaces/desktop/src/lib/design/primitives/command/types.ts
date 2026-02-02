/**
 * @file Command Primitive Types
 * @description Structural type declarations for the command primitive.
 * Aligned to taxonomy contract: kind="command"
 * Slots: root, input (self-closing), list, group, item, empty, separator
 * ariaStateProvider: "coldlight" — native combobox/listbox pattern with activedescendant focus.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Command root — combobox container for filtered list interaction */
export interface CommandProps extends OmitStyle<HTMLDivElement>, BaseProps {
	/** Current search/filter value (bindable) */
	value?: string;
	children?: Snippet;
}

/** Command input — search input for filtering (self-closing, no children) */
export interface CommandInputProps extends OmitStyle<HTMLInputElement>, BaseProps {}

/** Command list — scrollable container for results */
export interface CommandListProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Command group — labelled group of related items */
export interface CommandGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Command item — selectable option within the list */
export interface CommandItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Command empty — placeholder shown when no results match */
export interface CommandEmptyProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Command separator — visual divider between groups or items */
export interface CommandSeparatorProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
