/**
 * @file HoverCard Primitive Types
 * @description Structural type declarations for the hover-card primitive.
 * Aligned to taxonomy contract: kind="hover-card"
 * Slots: root (renderless), trigger, content, arrow
 * ariaStateProvider: "meltui" — createLinkPreview provides hover timing, positioning, and dismiss behavior.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** HoverCard root — renderless context provider (no DOM element) */
export interface HoverCardProps extends BaseProps {
	/** Open state (bindable) */
	open?: boolean;
	children?: Snippet;
}

/** HoverCard trigger — element that activates the hover card on hover/focus */
export interface HoverCardTriggerProps extends OmitStyle<HTMLAnchorElement>, BaseProps {
	children?: Snippet;
}

/** HoverCard content — supplementary content displayed on hover */
export interface HoverCardContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** HoverCard arrow — optional directional arrow pointing to trigger */
export interface HoverCardArrowProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
