/**
 * Badge primitive types.
 *
 * Badge is presentational (role="presentation").
 * The hook provides context for child Text/Icon components
 * and manages variant → visual resolution. No ARIA interaction.
 */

export type BadgeVariant =
	| "accent" | "informative" | "neutral" | "positive" | "notice" | "negative"
	| "gray" | "red" | "orange" | "yellow" | "chartreuse" | "celery"
	| "green" | "seafoam" | "cyan" | "blue" | "indigo" | "purple"
	| "fuchsia" | "magenta" | "pink" | "turquoise" | "brown" | "cinnamon" | "silver";

export type BadgeFillStyle = "bold" | "subtle" | "outline";

export type BadgeSize = "sm" | "md" | "lg" | "xl";

export interface UseBadgeProps {
	/** Color variant. Default: "neutral". */
	variant?: BadgeVariant;
	/** Fill style. Default: "bold". */
	fillStyle?: BadgeFillStyle;
	/** Size. Default: "md". */
	size?: BadgeSize;
	/** Whether the badge is purely decorative. */
	decorative?: boolean;
}

export interface UseBadgeReturn {
	/** Spread onto the root element. */
	readonly root: Record<string, unknown>;
}
