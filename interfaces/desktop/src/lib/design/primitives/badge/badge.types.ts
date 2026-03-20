import type { HTMLAttributes } from "svelte/elements";

export type BadgeVariant =
	| "accent" | "informative" | "neutral" | "positive" | "notice" | "negative"
	| "gray" | "red" | "orange" | "yellow" | "chartreuse" | "celery"
	| "green" | "seafoam" | "cyan" | "blue" | "indigo" | "purple"
	| "fuchsia" | "magenta" | "pink" | "turquoise" | "brown" | "cinnamon" | "silver";

export type BadgeFillStyle = "bold" | "subtle" | "outline";
export type BadgeSize = "sm" | "md" | "lg" | "xl";

export interface UseBadgeProps {
	variant?: BadgeVariant;
	fillStyle?: BadgeFillStyle;
	size?: BadgeSize;
	decorative?: boolean;
}

export type BadgeRootAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "badge";
	"data-slot": "root";
	"data-variant": BadgeVariant;
	"data-fill": BadgeFillStyle;
	"data-size": BadgeSize;
};

export interface UseBadgeReturn {
	readonly root: BadgeRootAttrs;
}
