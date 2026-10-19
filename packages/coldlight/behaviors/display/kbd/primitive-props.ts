import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Kbd primitive.
 *
 * Displays keyboard shortcuts using semantic <kbd> elements.
 * For displaying a single key, use one Kbd. For combinations (Ctrl+S),
 * use Kbd with multiple key children separated by visual separators.
 */
export interface KbdPrimitiveProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
	/** Snippet content rendered inside the kbd */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Keyboard shortcut keys (e.g., ["Ctrl", "S"]) */
	keys?: string[];
}
