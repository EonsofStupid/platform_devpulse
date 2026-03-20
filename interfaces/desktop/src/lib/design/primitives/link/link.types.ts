import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseLinkProps {
	/** Whether the link is disabled. */
	disabled?: boolean;
	/** Whether the element is not a native <a>. If true, adds role=link + tabindex + Enter handler. */
	elementType?: "a" | "span" | "div";
	/** The href (for native <a> only). */
	href?: string;
	/** Target attribute. */
	target?: string;
	/** Rel attribute. */
	rel?: string;
	/** Click handler. */
	onPress?: () => void;
	"aria-label"?: string;
	"aria-current"?: "page" | "step" | "location" | "date" | "time" | "true" | "false";
}

export interface LinkRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "link" | undefined;
	tabindex: 0 | -1 | undefined;
	href: string | undefined;
	target: string | undefined;
	rel: string | undefined;
	"aria-disabled": boolean | undefined;
	"aria-label": string | undefined;
	"aria-current": "page" | "step" | "location" | "date" | "time" | "true" | "false" | undefined;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface UseLinkReturn {
	readonly root: LinkRootAttrs;
}
