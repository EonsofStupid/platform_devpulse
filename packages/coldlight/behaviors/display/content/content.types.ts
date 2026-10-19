import type { HTMLAttributes } from "svelte/elements";

/** HTML elements valid for polymorphic content root. */
export type ContentElement = "div" | "section" | "article" | "aside" | "main" | "span";

export type ContentSize = "sm" | "base" | "lg";
export type ContentAlign = "start" | "center" | "end";

export interface UseContentProps {
	/**
	 * The HTML element to render as. Defaults to "div".
	 * Landmark elements (section, aside, main) require aria-label.
	 */
	as?: ContentElement;
	/** Text size scale. Defaults to "base". */
	size?: ContentSize;
	/** Text alignment. Defaults to "start". */
	align?: ContentAlign;
	/** Accessible label — required when using landmark element types. */
	"aria-label"?: string;
	/** ID of an element that labels this content region. */
	"aria-labelledby"?: string;
}

export type ContentRootAttrs = HTMLAttributes<HTMLElement> & {
	"data-kind": "content";
	"data-slot": "root";
	"data-size": ContentSize;
	"data-align": ContentAlign;
};

export interface UseContentReturn {
	/** The element type to render as. */
	readonly as: ContentElement;
	readonly root: ContentRootAttrs;
}
