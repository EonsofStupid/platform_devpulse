/**
 * @file ToggleGroup Primitive Types
 * @description Structural type declarations for the toggle-group primitive.
 * Aligned to taxonomy contract: kind="toggle-group"
 * Slots: root, item
 * ariaStateProvider: "meltui" — createToggleGroup provides roving tabindex + aria-pressed management.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** ToggleGroup root — container for a group of toggle buttons */
export interface ToggleGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	/** Currently pressed values (bindable) */
	value?: string[];
	children?: Snippet;
}

/** ToggleGroup item — individual toggle button within the group */
export interface ToggleGroupItemProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	/** Value identifying this item within the group */
	value: string;
	children?: Snippet;
}
