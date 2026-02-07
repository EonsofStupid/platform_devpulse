/**
 * @file Card Primitive Types
 * @description Structural type declarations for the card primitive.
 * Aligned to taxonomy contract: kind="card"
 * Slots: root, header, title, description, content, footer
 * ariaStateProvider: "coldlight" — semantic grouping container, direct ARIA application.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Card root — semantic grouping container */
export interface CardProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Card header — top section containing title and description */
export interface CardHeaderProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Card title — heading for the card */
export interface CardTitleProps extends OmitStyle<HTMLHeadingElement>, BaseProps {
	children?: Snippet;
}

/** Card description — supporting text below the title */
export interface CardDescriptionProps extends OmitStyle<HTMLParagraphElement>, BaseProps {
	children?: Snippet;
}

/** Card content — main body of the card */
export interface CardContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Card footer — bottom section for actions */
export interface CardFooterProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
