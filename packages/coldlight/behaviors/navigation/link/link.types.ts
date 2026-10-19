import type { HTMLAnchorAttributes } from "svelte/elements";

export interface UseLinkProps {
	disabled?: boolean;
	elementType?: "a" | "span" | "div";
	href?: string;
	target?: string;
	rel?: string;
	onPress?: () => void;
	"aria-label"?: string;
	"aria-current"?: "page" | "step" | "location" | "date" | "time" | "true" | "false";
}

export type LinkRootAttrs = HTMLAnchorAttributes & {
	"data-kind": "link";
	"data-slot": "root";
	"data-disabled"?: "";
};

export interface UseLinkReturn {
	readonly root: LinkRootAttrs;
}
