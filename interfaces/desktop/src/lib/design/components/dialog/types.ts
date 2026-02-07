/**
 * @file Dialog Component Types
 * @description Prop interfaces for all Dialog sub-components.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "$lib/design/primitives/types.js";
import type { ComponentSurfaceProps } from "../types.js";

export interface DialogProps extends ComponentSurfaceProps, BaseProps {
	open?: boolean;
	defaultOpen?: boolean;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	preventScroll?: boolean;
	children?: Snippet;
}

export interface DialogTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

export interface DialogPortalProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

export interface DialogOverlayProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

export interface DialogContentProps extends BaseProps {
	children?: Snippet;
	class?: string;
}

export interface DialogTitleProps extends OmitStyle<HTMLHeadingElement>, BaseProps {
	children?: Snippet;
}

export interface DialogDescriptionProps extends OmitStyle<HTMLParagraphElement>, BaseProps {
	children?: Snippet;
}

export interface DialogCloseProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

export interface DialogHeaderProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

export interface DialogFooterProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
