/**
 * @file Alert Primitive Types
 * @description Structural type declarations for the alert primitive.
 * Aligned to taxonomy contract: kind="alert"
 * Slots: root, title, description
 * ariaStateProvider: "coldlight" — native live region, direct ARIA application.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Alert root — live region container for important messages */
export interface AlertProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Alert title — heading for the alert message */
export interface AlertTitleProps extends OmitStyle<HTMLHeadingElement>, BaseProps {
	children?: Snippet;
}

/** Alert description — body text for the alert message */
export interface AlertDescriptionProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
