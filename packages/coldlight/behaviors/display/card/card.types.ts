import type { HTMLAttributes } from "svelte/elements";

export type CardVariant = "elevated" | "outlined" | "filled" | "ghost";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface UseCardProps {
	/** Visual variant. Defaults to "elevated". */
	variant?: CardVariant;
	/** Inner padding size. Defaults to "md". */
	padding?: CardPadding;
	/**
	 * When true, card is interactive (focusable, hover/press states).
	 * Applies tabindex="0" and role="button" to root.
	 */
	interactive?: boolean;
	/** Accessible label when card is interactive and has no visible heading. */
	"aria-label"?: string;
	/** ID of an element that labels this card (alternative to aria-label). */
	"aria-labelledby"?: string;
	/** Called when an interactive card is activated (click or Enter/Space). */
	onActivate?: (e: MouseEvent | KeyboardEvent) => void;
}

export type CardRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "card";
	"data-slot": "root";
	"data-variant": CardVariant;
	"data-padding": CardPadding;
	"data-interactive"?: "true";
};

export type CardHeaderAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "card";
	"data-slot": "header";
};

export type CardBodyAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "card";
	"data-slot": "body";
};

export type CardFooterAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "card";
	"data-slot": "footer";
};

export type CardMediaAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "card";
	"data-slot": "media";
};

export interface UseCardReturn {
	readonly root: CardRootAttrs;
	readonly header: CardHeaderAttrs;
	readonly body: CardBodyAttrs;
	readonly footer: CardFooterAttrs;
	readonly media: CardMediaAttrs;
}
