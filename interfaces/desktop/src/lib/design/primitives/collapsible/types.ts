/**
 * @file Collapsible Primitive Types
 * @description Structural type declarations for the collapsible primitive.
 * Aligned to taxonomy contract: kind="collapsible"
 * Slots: root, trigger, content
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Collapsible root — context provider, no DOM element */
export interface CollapsibleProps extends BaseProps {
	/** Controlled open state */
	open?: boolean;
	/** Disabled state */
	disabled?: boolean;
	children?: Snippet;
}

/** Collapsible trigger — button that toggles content visibility */
export interface CollapsibleTriggerProps
	extends OmitStyle<HTMLButtonElement>,
		BaseProps {
	children?: Snippet;
}

/** Collapsible content — expandable content region */
export interface CollapsibleContentProps
	extends OmitStyle<HTMLDivElement>,
		BaseProps {
	children?: Snippet;
}
