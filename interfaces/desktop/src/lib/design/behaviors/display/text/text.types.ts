import type { HTMLAttributes } from "svelte/elements";

/** Elements valid for polymorphic text rendering. */
export type TextElement = "span" | "p" | "strong" | "em" | "small" | "div" | "label" | "abbr";

export type TextSize = "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl" | "3xl";

export type TextWeight = "regular" | "medium" | "semibold" | "bold";
export type TextAlign = "start" | "center" | "end";
export type TextTruncate = "none" | "single" | "multi";

export interface UseTextProps {
	/** HTML element to render as. Defaults to "span". */
	as?: TextElement;
	/** Font size scale. Defaults to "base". */
	size?: TextSize;
	/** Font weight. Defaults to "regular". */
	weight?: TextWeight;
	/** Text alignment. Defaults to "start". */
	align?: TextAlign;
	/** Text truncation behaviour. Defaults to "none". */
	truncate?: TextTruncate;
	/**
	 * Accessible label — use when the text content alone is insufficient
	 * (e.g., for abbreviations using <abbr>).
	 */
	"aria-label"?: string;
}

export type TextRootAttrs = HTMLAttributes<HTMLElement> & {
	"data-kind": "text";
	"data-slot": "root";
	"data-size": TextSize;
	"data-weight": TextWeight;
	"data-align": TextAlign;
	"data-truncate": TextTruncate;
};

export interface UseTextReturn {
	/** The element to render as. */
	readonly as: TextElement;
	readonly root: TextRootAttrs;
}
