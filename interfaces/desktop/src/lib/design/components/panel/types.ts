import type { Snippet } from "svelte";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ComponentSurfaceProps } from "../types.js";

export interface PanelProps extends ComponentSurfaceProps, BaseProps {
	padding?: "none" | "sm" | "md" | "lg";
	children?: Snippet;
	class?: string;
}

export interface PanelHeaderProps extends BaseProps {
	children?: Snippet;
	class?: string;
}

export interface PanelBodyProps extends BaseProps {
	children?: Snippet;
	class?: string;
}

export interface PanelFooterProps extends BaseProps {
	children?: Snippet;
	class?: string;
}
