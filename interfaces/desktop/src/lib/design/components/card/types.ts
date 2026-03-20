/**
 * @file Card Component Types
 * @kind card
 * @layer components
 *
 * Card is a compound structural surface container.
 * Multi-part: Root, Header, Title, Description, Action, Content, Footer, Cover.
 *
 * Root supports element polymorphism: div (default), a (link), button (clickable).
 * Each sub-component is a styled structural element with data-kind="card" data-slot.
 *
 * Follows Ark UI / Zag API conventions:
 *   - ids for composition
 *   - dir for RTL
 *   - disabled state
 *   - element render delegation on sub-components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLAnchorAttributes } from "svelte/elements";
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// SHARED
// =============================================================================

/** Visual variant — maps to a preset in the registry. */
export type CardVariant = "default" | "outlined" | "elevated" | "ghost" | "glow";

/** Layout orientation. */
export type CardOrientation = "vertical" | "horizontal";

/** Element polymorphism — what the root renders as. */
export type CardAs = "div" | "a" | "button";

/** Preset mapping per variant. */
export const CARD_VARIANT_PRESETS: Record<CardVariant, string> = {
	default: "card-default",
	outlined: "card-default",
	ghost: "card-default",
	elevated: "card-elevated",
	glow: "card-glow",
};

/** Element IDs for composition. */
export interface CardIds {
	root?: string;
	cover?: string;
	header?: string;
	title?: string;
	description?: string;
	action?: string;
	content?: string;
	footer?: string;
}

// =============================================================================
// ROOT
// =============================================================================

/** Props for Card.Root — the outer container. */
export interface CardRootProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class" | "dir">,
		PreparedComponentProps {
	/** Element IDs for composition. */
	ids?: Partial<CardIds>;
	/** Render as div (default), anchor, or button. */
	as?: CardAs;
	/** Layout direction. Default: "vertical". */
	orientation?: CardOrientation;
	/** Visual variant. Default: "default". */
	variant?: CardVariant;
	/** Optional accessible label. */
	label?: string;
	/** ID of element that labels this card. */
	labelledBy?: string;
	/** When as="a" — the link href. */
	href?: string;
	/** When as="a" — link target. */
	target?: HTMLAnchorAttributes["target"];
	/** When as="a" or as="button" — disabled state. */
	disabled?: boolean;
	/** Text/writing direction. Default: "ltr". */
	dir?: "ltr" | "rtl";
	children?: Snippet;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Shared base for all card sub-component props. */
interface CardSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
	/** Render the element yourself — full control over the rendered output. */
	element?: Snippet<[HTMLAttributes<HTMLElement>]>;
}

/** Props for Card.Header */
export interface CardHeaderProps extends CardSlotProps {}

/** Props for Card.Title — renders as heading element. */
export interface CardTitleProps extends CardSlotProps {
	/** Heading level. Default: "h3". */
	level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

/** Props for Card.Description */
export interface CardDescriptionProps extends CardSlotProps {}

/** Props for Card.Action — header action area (e.g., buttons, links). */
export interface CardActionProps extends CardSlotProps {}

/** Props for Card.Content — main body area. */
export interface CardContentProps extends CardSlotProps {}

/** Props for Card.Footer */
export interface CardFooterProps extends CardSlotProps {}

/** Props for Card.Cover — media/image area. */
export interface CardCoverProps extends CardSlotProps {
	/** Cover position relative to content. Default: "top". */
	position?: "top" | "bottom" | "start" | "end";
}
