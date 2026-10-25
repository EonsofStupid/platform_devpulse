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

export interface UseLinkReturn {
	readonly root: Record<string, unknown>;
}
