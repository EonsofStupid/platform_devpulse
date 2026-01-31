/**
 * @file Tabs Primitive Types
 * @description Structural type declarations for the tabs primitive.
 * Aligned to taxonomy contract: kind="tabs"
 * Slots: root, list, trigger, content
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA via component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Tabs root — container and context provider */
export interface TabsProps extends OmitStyle<HTMLDivElement>, BaseProps {
	/** Currently selected tab value (bindable) */
	value?: string;
	/** Content */
	children?: Snippet;
}

/** TabsList — container for tab triggers */
export interface TabsListProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** TabsTrigger — button for selecting a tab */
export interface TabsTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	/** Tab identifier — matches corresponding TabsContent value */
	value: string;
	/** Disabled state */
	disabled?: boolean;
	/** Content */
	children?: Snippet;
}

/** TabsContent — panel for tab content */
export interface TabsContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	/** Tab identifier — matches corresponding TabsTrigger value */
	value: string;
	/** Content */
	children?: Snippet;
}
