import type { Snippet } from "svelte";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ComponentSurfaceProps } from "../types.js";

export interface TabsProps extends ComponentSurfaceProps, BaseProps {
	value?: string;
	orientation?: "horizontal" | "vertical";
	activateOnFocus?: boolean;
	loop?: boolean;
	children?: Snippet;
}

export interface TabsListProps extends BaseProps {
	children?: Snippet;
	class?: string;
}

export interface TabsTriggerProps extends BaseProps {
	value: string;
	disabled?: boolean;
	children?: Snippet;
	class?: string;
}

export interface TabsContentProps extends BaseProps {
	value: string;
	children?: Snippet;
	class?: string;
}
