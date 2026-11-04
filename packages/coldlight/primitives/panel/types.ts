import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Panel primitive: a container with header, body and
 * footer slots. ARIA semantics are optional (region, section, article landmarks).
 */
export interface PanelPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content: the header, body and footer */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
}
